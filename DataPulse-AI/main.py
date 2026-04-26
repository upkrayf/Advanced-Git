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
    guardrails_agent,
    sql_agent,
    execute_sql,
    error_agent,
    analysis_agent,
    visualization_agent,
)

app = FastAPI(title="DataPulse AI", version="4.0.0")

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
    """
    If guardrail already set final_answer (greeting / blocked / out-of-scope) → END.
    Otherwise (in-scope) → sql_agent.
    """
    if state.get("final_answer") or not state.get("is_in_scope"):
        return "end"
    return "sql_agent"


def route_after_execute_sql(state: AgentState) -> str:
    """
    If a final_answer was set during execution (forbidden / no-data) → END.
    If there's an error and retries remain → error_agent.
    Otherwise → analysis_agent.
    """
    if state.get("final_answer"):
        return "end"
    if state.get("error") and state.get("iteration_count", 0) < 3:
        return "error_agent"
    return "analysis_agent"


def route_after_error_agent(state: AgentState) -> str:
    """
    If max retries hit (final_answer set) → END.
    Otherwise → execute_sql with the fixed SQL.
    """
    if state.get("final_answer"):
        return "end"
    return "execute_sql"


def route_after_analysis(state: AgentState) -> str:
    """
    Decide Graph Need: if data has 2+ rows → visualization_agent, else → END.
    """
    if state.get("needs_visualization"):
        return "visualization_agent"
    return "end"


# ─────────────────────────────────────────────────────────────────────────────
#  LANGGRAPH WORKFLOW
# ─────────────────────────────────────────────────────────────────────────────
#
#  START
#    │
#    ▼
#  guardrails_agent ──[greeting / blocked / out-of-scope]──→ END
#    │ [in-scope]
#    ▼
#  sql_agent (generate + validate)
#    │
#    ▼
#  execute_sql ──[error, retry<3]──→ error_agent ──→ execute_sql (loop)
#    │                                    └──[max retries]──→ END
#    │ [success]
#    ▼
#  analysis_agent
#    │
#    ├──[needs_visualization=True]──→ visualization_agent ──→ END
#    └──[needs_visualization=False]─────────────────────────→ END

workflow = StateGraph(AgentState)

workflow.add_node("guardrails_agent",    guardrails_agent)
workflow.add_node("sql_agent",           sql_agent)
workflow.add_node("execute_sql",         execute_sql)
workflow.add_node("error_agent",         error_agent)
workflow.add_node("analysis_agent",      analysis_agent)
workflow.add_node("visualization_agent", visualization_agent)

workflow.set_entry_point("guardrails_agent")

workflow.add_conditional_edges(
    "guardrails_agent",
    route_after_guardrail,
    {"sql_agent": "sql_agent", "end": END},
)

workflow.add_edge("sql_agent", "execute_sql")

workflow.add_conditional_edges(
    "execute_sql",
    route_after_execute_sql,
    {
        "error_agent":    "error_agent",
        "analysis_agent": "analysis_agent",
        "end":            END,
    },
)

workflow.add_conditional_edges(
    "error_agent",
    route_after_error_agent,
    {"execute_sql": "execute_sql", "end": END},
)

workflow.add_conditional_edges(
    "analysis_agent",
    route_after_analysis,
    {"visualization_agent": "visualization_agent", "end": END},
)

workflow.add_edge("visualization_agent", END)

app_graph = workflow.compile()

# ─────────────────────────────────────────────────────────────────────────────
#  API MODELS
# ─────────────────────────────────────────────────────────────────────────────

class ChatRequest(BaseModel):
    question: str
    user_id: Optional[int] = None
    # role_type and store_id intentionally NOT accepted from frontend.
    # Resolved from the database by guardrails_agent.


class ChatResponse(BaseModel):
    reply: Optional[str]
    sql_query: Optional[str]
    data: List[dict]
    guardrail_status: str
    blocked_reason: Optional[str]
    visualization: Optional[str]
    resolved_role: Optional[str]
    resolved_store_id: Optional[int]


# ─────────────────────────────────────────────────────────────────────────────
#  ENDPOINT
# ─────────────────────────────────────────────────────────────────────────────

@app.post("/ask", response_model=ChatResponse)
async def ask_ai(request: ChatRequest):
    initial_state: AgentState = {
        "question":           request.question,
        "user_id":            request.user_id,
        "verified_role":      None,
        "verified_store_ids": None,
        "verified_store_id":  None,
        "guardrail_status":        None,
        "guardrail_blocked_reason": None,
        "is_in_scope":        False,
        "sql_query":          None,
        "query_result":       None,
        "query_data":         [],
        "error":              None,
        "iteration_count":    0,
        "final_answer":       None,
        "visualization_code": None,
        "needs_visualization": None,
    }

    try:
        output = app_graph.invoke(initial_state)

        guardrail_status = output.get("guardrail_status") or "passed"
        blocked_reason   = output.get("guardrail_blocked_reason")

        return ChatResponse(
            reply             = output.get("final_answer"),
            sql_query         = output.get("sql_query"),
            data              = output.get("query_data") or [],
            guardrail_status  = guardrail_status,
            blocked_reason    = blocked_reason if guardrail_status == "blocked" else None,
            visualization     = output.get("visualization_code"),
            resolved_role     = output.get("verified_role"),
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
    return {"status": "ok", "version": "4.0.0"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
