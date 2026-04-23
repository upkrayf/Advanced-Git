import os
from dotenv import load_dotenv
load_dotenv()

from fastapi import FastAPI
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware
from langgraph.graph import StateGraph, END

# Import nodes and state
from state import AgentState
from agents import (
    guardrail_node, 
    sql_generator_node, 
    execute_query_node, 
    error_recovery_node, 
    analysis_node, 
    visualization_node
)

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- LangGraph Setup ---

def should_continue_after_execution(state: AgentState):
    """Decides whether to go to analysis or error recovery."""
    if state.get("error"):
        # If we've already tried too many times, just analyze the error
        if state.get("iteration_count", 0) >= 2:
            return "analyze"
        return "recover"
    return "analyze"

def should_proceed_after_guardrail(state: AgentState):
    """Decides whether to generate SQL or jump to analysis."""
    if state.get("is_in_scope"):
        return "generate_sql"
    return "analyze"

workflow = StateGraph(AgentState)

# Add Nodes
workflow.add_node("guardrail", guardrail_node)
workflow.add_node("sql_generator", sql_generator_node)
workflow.add_node("execute_query", execute_query_node)
workflow.add_node("error_recovery", error_recovery_node)
workflow.add_node("analysis", analysis_node)
workflow.add_node("visualization", visualization_node)

# Define Edges
workflow.set_entry_point("guardrail")

workflow.add_conditional_edges(
    "guardrail",
    should_proceed_after_guardrail,
    {
        "generate_sql": "sql_generator",
        "analyze": "analysis"
    }
)

workflow.add_edge("sql_generator", "execute_query")

workflow.add_conditional_edges(
    "execute_query",
    should_continue_after_execution,
    {
        "recover": "error_recovery",
        "analyze": "analysis"
    }
)

workflow.add_edge("error_recovery", "execute_query")
workflow.add_edge("analysis", "visualization")
workflow.add_edge("visualization", END)

# Compile
app_graph = workflow.compile()

# --- API Endpoints ---

from typing import Optional

class ChatRequest(BaseModel):
    question: str
    user_id: Optional[int] = None
    role_type: Optional[str] = None

@app.post("/ask")
async def ask_ai(request: ChatRequest):
    # Initialize state
    initial_state = {
        "question": request.question,
        "is_in_scope": True,
        "iteration_count": 0,
        "sql_query": None,
        "query_result": None,
        "error": None,
        "final_answer": None,
        "visualization_code": None,
        "user_id": request.user_id,
        "role_type": request.role_type
    }
    
    # Run the graph
    inputs = initial_state
    final_output = app_graph.invoke(inputs)
    
    return {
        "reply": final_output.get("final_answer"),
        "sqlQuery": final_output.get("sql_query", "No SQL generated."),
        "visualization": final_output.get("visualization_code")
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)