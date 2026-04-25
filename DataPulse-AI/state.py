from typing import TypedDict, Optional, List, Any

class AgentState(TypedDict):
    # Input
    question: str
    user_id: Optional[int]
    role_type: Optional[str]       # ADMIN | CORPORATE | INDIVIDUAL
    store_id: Optional[int]        # Corporate: store owned by this user (from session)

    # Security layer
    guardrail_status: Optional[str]         # "passed" | "blocked"
    guardrail_blocked_reason: Optional[str] # "Prompt Injection" | "Filter Bypass" | "Cross-store Data Access" | ...

    # Scope
    is_in_scope: bool

    # SQL pipeline
    sql_query: Optional[str]
    query_result: Optional[str]        # JSON string representation (for LLM analysis)
    query_data: Optional[List[Any]]    # Structured list of dicts (for frontend)
    error: Optional[str]
    iteration_count: int

    # Output
    final_answer: Optional[str]
    visualization_code: Optional[str]
