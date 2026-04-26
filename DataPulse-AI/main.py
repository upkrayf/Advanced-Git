import os
from dotenv import load_dotenv
load_dotenv()

from fastapi import FastAPI
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware
from langgraph.graph import StateGraph, END
from typing import Optional, List

from state import AgentState
from agents import (
    security_guardrail_node,
    blocked_response_node,
    out_of_scope_node,
    sql_generator_node,
    sql_validator_node,
    execute_query_node,
    error_recovery_node,
    analysis_node,
)

app = FastAPI(title="DataPulse AI", version="3.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# ─────────────────────────────────────────────────────────────────────────────
#  ROUTING
# ─────────────────────────────────────────────────────────────────────────────

def route_after_guardrail(state: AgentState) -> str:
    if state.get("guardrail_status") == "blocked":
        return "blocked_response"
    if state.get("is_in_scope"):
        return "sql_generator"
    return "out_of_scope"


def route_after_execution(state: AgentState) -> str:
    if state.get("final_answer"):
        return "end"
    if state.get("error") and state.get("iteration_count", 0) < 2:
        return "error_recovery"
    return "analysis"


def route_after_recovery(state: AgentState) -> str:
    if state.get("final_answer"):
        return "end"
    return "sql_generator"


# ─────────────────────────────────────────────────────────────────────────────
#  LANGGRAPH WORKFLOW
# ─────────────────────────────────────────────────────────────────────────────
#
#  security_guardrail  (DB lookup → sets verified_role, verified_store_ids)
#      ├─[blocked]──────────────→ blocked_response → END
#      ├─[out_of_scope]─────────→ out_of_scope     → END
#      └─[in_scope]─────────────→ sql_generator
#                                      ↓
#                                 sql_validator
#                                      ↓
#                                 execute_query
#                                  ├─[error, retry<2]→ error_recovery → sql_generator
#                                  ├─[max retries]───→ END
#                                  └─[success]───────→ analysis → END

workflow = StateGraph(AgentState)

workflow.add_node("security_guardrail", security_guardrail_node)
workflow.add_node("blocked_response",   blocked_response_node)
workflow.add_node("out_of_scope",       out_of_scope_node)
workflow.add_node("sql_generator",      sql_generator_node)
workflow.add_node("sql_validator",      sql_validator_node)
workflow.add_node("execute_query",      execute_query_node)
workflow.add_node("error_recovery",     error_recovery_node)
workflow.add_node("analysis",           analysis_node)

workflow.set_entry_point("security_guardrail")

workflow.add_conditional_edges(
    "security_guardrail",
    route_after_guardrail,
    {
        "blocked_response": "blocked_response",
        "out_of_scope":     "out_of_scope",
        "sql_generator":    "sql_generator",
    },
)

workflow.add_edge("sql_generator", "sql_validator")
workflow.add_edge("sql_validator", "execute_query")

workflow.add_conditional_edges(
    "execute_query",
    route_after_execution,
    {
        "error_recovery": "error_recovery",
        "analysis":       "analysis",
        "end":            END,
    },
)

workflow.add_conditional_edges(
    "error_recovery",
    route_after_recovery,
    {
        "sql_generator": "sql_generator",
        "end":           END,
    },
)

workflow.add_edge("blocked_response", END)
workflow.add_edge("out_of_scope",     END)
workflow.add_edge("analysis",         END)

app_graph = workflow.compile()

# ─────────────────────────────────────────────────────────────────────────────
#  API MODELS
# ─────────────────────────────────────────────────────────────────────────────

class ChatRequest(BaseModel):
    question: str
    user_id: Optional[int] = None
    # role_type and store_id are intentionally NOT accepted from frontend.
    # They are always resolved from the database by the guardrail agent.


class ChatResponse(BaseModel):
    reply: Optional[str]
    sql_query: Optional[str]
    data: List[dict]
    guardrail_status: str        # "passed" | "blocked"
    blocked_reason: Optional[str]
    visualization: Optional[str]
    # Resolved identity (for debugging / frontend display)
    resolved_role: Optional[str]
    resolved_store_id: Optional[int]


# ─────────────────────────────────────────────────────────────────────────────
#  ENDPOINT
# ─────────────────────────────────────────────────────────────────────────────

@app.post("/ask", response_model=ChatResponse)
async def ask_ai(request: ChatRequest):
    initial_state: AgentState = {
        "question":          request.question,
        "user_id":           request.user_id,
        # DB-verified fields are populated by security_guardrail_node
        "verified_role":     None,
        "verified_store_ids": None,
        "verified_store_id": None,
        # Security
        "guardrail_status":       None,
        "guardrail_blocked_reason": None,
        # Scope
        "is_in_scope":       False,
        # SQL pipeline
        "sql_query":         None,
        "query_result":      None,
        "query_data":        [],
        "error":             None,
        "iteration_count":   0,
        # Output
        "final_answer":      None,
        "visualization_code": None,
    }

    try:
        output = app_graph.invoke(initial_state)

        guardrail_status = output.get("guardrail_status") or "passed"
        blocked_reason   = output.get("guardrail_blocked_reason")

        return ChatResponse(
            reply           = output.get("final_answer"),
            sql_query       = output.get("sql_query"),
            data            = output.get("query_data") or [],
            guardrail_status= guardrail_status,
            blocked_reason  = blocked_reason if guardrail_status == "blocked" else None,
            visualization   = output.get("visualization_code"),
            resolved_role   = output.get("verified_role"),
            resolved_store_id = output.get("verified_store_id"),
        )

    except Exception as exc:
        import traceback
        traceback.print_exc()
        return ChatResponse(
            reply             = f"AI Asistanı çalışırken bir iç hata oluştu: {exc}",
            sql_query         = None,
            data              = [],
            guardrail_status  = "passed",
            blocked_reason    = None,
            visualization     = None,
            resolved_role     = None,
            resolved_store_id = None,
        )


@app.get("/health")
async def health():
    return {"status": "ok", "version": "3.0.0"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
