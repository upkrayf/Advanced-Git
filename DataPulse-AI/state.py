from typing import TypedDict, Optional, List, Any


class AgentState(TypedDict):
    # ── Input ─────────────────────────────────────────────────────────────────
    question: str
    user_id: Optional[int]

    # ── DB-verified identity (set by guardrail, never trusted from frontend) ──
    verified_role: Optional[str]             # ADMIN | CORPORATE | INDIVIDUAL
    verified_store_ids: Optional[List[int]]  # all store IDs owned by this corporate user
    verified_store_id: Optional[int]         # primary store_id (first owned store)

    # ── Security layer ────────────────────────────────────────────────────────
    guardrail_status: Optional[str]          # "passed" | "blocked"
    guardrail_blocked_reason: Optional[str]

    # ── Scope ─────────────────────────────────────────────────────────────────
    is_in_scope: bool

    # ── SQL pipeline ──────────────────────────────────────────────────────────
    sql_query: Optional[str]
    query_result: Optional[str]      # JSON string for LLM analysis
    query_data: Optional[List[Any]]  # structured list of dicts for frontend
    error: Optional[str]
    iteration_count: int

    # ── Output ────────────────────────────────────────────────────────────────
    final_answer: Optional[str]
    visualization_code: Optional[str]
    needs_visualization: Optional[bool]   # set by analysis_agent for decide_graph routing
