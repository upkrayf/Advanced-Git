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

app = FastAPI(title="DataPulse AI", version="2.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# ─────────────────────────────────────────────────────────────────────────────
#  ROUTING FUNCTIONS
# ─────────────────────────────────────────────────────────────────────────────

def route_after_guardrail(state: AgentState) -> str:
    if state.get("guardrail_status") == "blocked":
        return "blocked_response"
    if state.get("is_in_scope"):
        return "sql_generator"
    return "out_of_scope"


def route_after_execution(state: AgentState) -> str:
    # If a final_answer was already set by error_recovery (max retries), go to END
    if state.get("final_answer"):
        return "end"
    if state.get("error") and state.get("iteration_count", 0) < 2:
        return "error_recovery"
    return "analysis"


def route_after_recovery(state: AgentState) -> str:
    # Max retries hit — final_answer already set
    if state.get("final_answer"):
        return "end"
    return "sql_generator"


# ─────────────────────────────────────────────────────────────────────────────
#  LANGGRAPH WORKFLOW
# ─────────────────────────────────────────────────────────────────────────────
#
#  security_guardrail
#      ├─[blocked]──────────────→ blocked_response → END
#      ├─[out_of_scope]─────────→ out_of_scope     → END
#      └─[in_scope]─────────────→ sql_generator
#                                      ↓
#                                 sql_validator
#                                      ↓
#                                 execute_query
#                                  ├─[error, retry<2]→ error_recovery → sql_generator (loop)
#                                  ├─[max retries hit]→ END
#                                  └─[success]────────→ analysis → END

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

workflow.add_edge("sql_generator",   "sql_validator")
workflow.add_edge("sql_validator",   "execute_query")

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
#  API
# ─────────────────────────────────────────────────────────────────────────────

class ChatRequest(BaseModel):
    question: str
    user_id: Optional[int] = None
    role_type: Optional[str] = None   # ADMIN | CORPORATE | INDIVIDUAL
    store_id: Optional[int] = None    # Corporate: store_id from JWT session


class ChatResponse(BaseModel):
    reply: Optional[str]
    sql_query: Optional[str]
    data: List[dict]
    guardrail_status: str             # "passed" | "blocked"
    error_details: Optional[str]      # reason if blocked
    visualization: Optional[str]


@app.post("/ask", response_model=ChatResponse)
async def ask_ai(request: ChatRequest):
    initial_state: AgentState = {
        "question":               request.question,
        "user_id":                request.user_id,
        "role_type":              request.role_type,
        "store_id":               request.store_id,
        "guardrail_status":       None,
        "guardrail_blocked_reason": None,
        "is_in_scope":            False,
        "sql_query":              None,
        "query_result":           None,
        "query_data":             [],
        "error":                  None,
        "iteration_count":        0,
        "final_answer":           None,
        "visualization_code":     None,
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
            error_details   = blocked_reason if guardrail_status == "blocked" else None,
            visualization   = output.get("visualization_code"),
        )

    except Exception as exc:
        import traceback
        traceback.print_exc()
        return ChatResponse(
            reply            = f"AI Asistanı çalışırken bir iç hata oluştu: {exc}",
            sql_query        = None,
            data             = [],
            guardrail_status = "passed",
            error_details    = None,
            visualization    = None,
        )


@app.get("/health")
async def health():
    return {"status": "ok", "version": "2.0.0"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
