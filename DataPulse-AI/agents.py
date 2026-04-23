import os
import re
from typing import Dict, Any
from state import AgentState
from langchain_google_genai import ChatGoogleGenerativeAI
from sqlalchemy import create_engine, text
from dotenv import load_dotenv

load_dotenv()

# Initialize LLM
llm = ChatGoogleGenerativeAI(
    model=os.getenv("SELECTED_MODEL", "gemini-2.0-flash"), 
    google_api_key=os.getenv("GOOGLE_API_KEY")
)

SCHEMA_CONTEXT = """
You are the Text2SQL Expert for DataPulse. You have access to these tables:
1. USERS (id, email, password_hash, role_type, gender)
2. CUSTOMER_PROFILES (id, user_id, age, city, membership_type)
3. CATEGORIES (id, name)
4. STORES (id, name, status, owner_id)
5. PRODUCTS (id, store_id, category_id, sku, name, description, unit_price, stock_quantity)
6. SHIPMENTS (id, warehouse_block, mode_of_shipment, product_importance, reaching_on_time)
7. ORDERS (id, user_id, shipment_id, order_number, status, grand_total, order_date)
8. ORDER_ITEMS (id, order_id, product_id, quantity, price)
9. PAYMENTS (id, order_id, payment_type, payment_value)
10. REVIEWS (id, product_id, rating, comment, sentiment, date)

Rules:
- Strictly use column names as defined.
- Return ONLY SQL inside ```sql [QUERY] ``` blocks.
"""

def guardrail_node(state: AgentState) -> Dict:
    """Checks if the question is in scope (e-commerce)."""
    prompt = f"Is the following question related to e-commerce, sales, products, or customers? Answer with YES or NO only.\nQuestion: {state['question']}"
    response = llm.invoke(prompt)
    is_in_scope = "YES" in response.content.upper()
    return {"is_in_scope": is_in_scope}

def sql_generator_node(state: AgentState) -> Dict:
    """Generates SQL from natural language."""
    if not state.get("is_in_scope"):
        return {"sql_query": None}
    
    role = state.get("role_type", "INDIVIDUAL")
    user_id = state.get("user_id")
    
    rbac_clause = ""
    if role == "ADMIN":
        rbac_clause = "You have ADMIN privileges. You can access all data without restrictions."
    elif role == "CORPORATE":
        if user_id:
            rbac_clause = f"IMPORTANT CORPORATE POLICY: The user has user_id={user_id}. You MUST RESTRICT all queries to data owned by this user. For queries involving STORES, use WHERE owner_id={user_id}. For other tables like PRODUCTS, ORDERS, REVIEWS, ALWAYS JOIN with STORES and filter by STORES.owner_id={user_id}. NEVER return data from other stores."
        else:
            rbac_clause = "IMPORTANT CORPORATE POLICY: The user is a Corporate, but user_id is missing. Query must fail. Provide a SELECT 'Error' query."
    else: # INDIVIDUAL
        if user_id:
            rbac_clause = f"IMPORTANT INDIVIDUAL POLICY: The user has user_id={user_id}. For tables ORDERS, REVIEWS, CUSTOMER_PROFILES, PAYMENTS (via orders) you MUST ONLY query rows where user_id={user_id}. Do not expose other users' private data."
        else:
            rbac_clause = "IMPORTANT INDIVIDUAL POLICY: The user is an Individual, but user_id is missing. Filter by user_id=-1 to prevent data leak."
    
    prompt = f"{SCHEMA_CONTEXT}\n\n{rbac_clause}\n\nGenerate a SQL query for: {state['question']}"
    response = llm.invoke(prompt)
    
    sql_match = re.search(r"```sql\n(.*?)\n```", response.content, re.DOTALL)
    sql = sql_match.group(1) if sql_match else None
    return {"sql_query": sql}

def execute_query_node(state: AgentState) -> Dict:
    """Executes the generated SQL."""
    sql = state.get("sql_query")
    if not sql:
        return {"query_result": "No SQL generated."}
    
    try:
        engine = create_engine(os.getenv("DATABASE_URL"))
        with engine.connect() as connection:
            result = connection.execute(text(sql))
            rows = result.fetchall()
            safe_results = []
            for row in rows:
                safe_row = {k: str(v) if v is not None else None for k, v in row._mapping.items()}
                safe_results.append(safe_row)
            return {"query_result": str(safe_results), "error": None}
    except Exception as e:
        return {"error": str(e)}

def error_recovery_node(state: AgentState) -> Dict:
    """Attempts to fix the SQL if it failed."""
    if state.get("iteration_count", 0) >= 2:
        return {"final_answer": "I tried fixing the query but failed. Error: " + state['error']}
    
    role = state.get("role_type", "INDIVIDUAL")
    user_id = state.get("user_id")
    
    rbac_clause = ""
    if role == "ADMIN":
        rbac_clause = "You have ADMIN privileges. You can access all data without restrictions."
    elif role == "CORPORATE":
        if user_id:
            rbac_clause = f"IMPORTANT CORPORATE POLICY: The user has user_id={user_id}. You MUST RESTRICT all queries to data owned by this user. For queries involving STORES, use WHERE owner_id={user_id}. For other tables like PRODUCTS, ORDERS, REVIEWS, ALWAYS JOIN with STORES and filter by STORES.owner_id={user_id}. NEVER return data from other stores."
    else: # INDIVIDUAL
        if user_id:
            rbac_clause = f"IMPORTANT INDIVIDUAL POLICY: The user has user_id={user_id}. For tables ORDERS, REVIEWS, CUSTOMER_PROFILES, PAYMENTS (via orders) you MUST ONLY query rows where user_id={user_id}. Do not expose other users' private data."
    
    prompt = f"{SCHEMA_CONTEXT}\n\n{rbac_clause}\n\nThe SQL query: {state['sql_query']}\nFailed with error: {state['error']}\nPlease fix the query and return ONLY the new SQL."
    response = llm.invoke(prompt)
    
    sql_match = re.search(r"```sql\n(.*?)\n```", response.content, re.DOTALL)
    new_sql = sql_match.group(1) if sql_match else None
    
    return {
        "sql_query": new_sql, 
        "iteration_count": state.get("iteration_count", 0) + 1
    }

def analysis_node(state: AgentState) -> Dict:
    """Analyzes the data and provides a natural language answer."""
    if not state.get("is_in_scope"):
        return {"final_answer": "I'm sorry, I can only answer questions related to our e-commerce data."}
    
    if state.get("error"):
        return {"final_answer": "I encountered an error while retrieving data: " + state['error']}
    
    prompt = f"Based on these results: {state['query_result']}\nOriginal Question: {state['question']}\nPlease provide a professional summary in English."
    response = llm.invoke(prompt)
    return {"final_answer": response.content}

def visualization_node(state: AgentState) -> Dict:
    """Generates Plotly JSON if the data is visualizable."""
    if not state.get("query_result") or "error" in state['query_result']:
        return {"visualization_code": None}
    
    prompt = f"Data: {state['query_result']}\nQuestion: {state['question']}\nIf this data can be visualized (like charts), provide ONLY a valid Plotly JSON configuration (data and layout). If not, return 'NONE'."
    response = llm.invoke(prompt)
    
    if "NONE" in response.content.upper():
        return {"visualization_code": None}
    
    # Clean markdown code blocks if present
    clean_json = re.sub(r"```(?:json)?\n(.*?)\n```", r"\1", response.content, flags=re.DOTALL).strip()
    return {"visualization_code": clean_json}
