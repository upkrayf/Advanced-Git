"""
DataPulse AI — Multi-Agent Text-to-SQL with Security Guardrails
Architecture:
  SecurityGuardrailAgent → SQLGeneratorAgent → SQLValidatorAgent
  → ExecuteQueryAgent → AnalysisAgent

Security layers:
  1. Pattern-based: prompt injection, filter bypass, cross-store access
  2. Context injection: mandatory store_id/user_id filter in every SQL
  3. Post-generation validation: SQL verified to contain owner filter before execution
"""

import os
import re
import json
import logging
from typing import Dict, Optional, List

from state import AgentState
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_openai import ChatOpenAI
from sqlalchemy import create_engine, text
from dotenv import load_dotenv

load_dotenv()

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s — %(message)s",
)
logger = logging.getLogger("datapulse.agents")

# ─────────────────────────────────────────────────────────────────────────────
#  LLM  (temperature=0 for deterministic SQL)
# ─────────────────────────────────────────────────────────────────────────────

selected_model = os.getenv("SELECTED_MODEL", "gemini-2.0-flash")

if selected_model.startswith("gpt"):
    llm = ChatOpenAI(
        model=selected_model,
        api_key=os.getenv("OPENAI_API_KEY"),
        temperature=0,
    )
else:
    llm = ChatGoogleGenerativeAI(
        model=selected_model,
        google_api_key=os.getenv("GOOGLE_API_KEY"),
        temperature=0,
    )

# ─────────────────────────────────────────────────────────────────────────────
#  DB ENGINE  (shared connection pool)
# ─────────────────────────────────────────────────────────────────────────────

_engine = None

def _get_engine():
    global _engine
    if _engine is None:
        _engine = create_engine(
            os.getenv("DATABASE_URL"),
            pool_size=5,
            max_overflow=10,
            pool_pre_ping=True,
            pool_recycle=3600,
        )
    return _engine

# ─────────────────────────────────────────────────────────────────────────────
#  SECURITY CONSTANTS
# ─────────────────────────────────────────────────────────────────────────────

FORBIDDEN_MARKER = "ERISIM_REDDEDILDI"

# Prompt injection — pattern matched, never sent to LLM to avoid jailbreak via LLM evaluation
_INJECTION_PATTERNS = [
    # English
    r"ignore\s+(?:previous|prior|all)\s+instructions?",
    r"forget\s+(?:your\s+)?(?:rules?|instructions?|system\s+prompt|guidelines?)",
    r"you\s+are\s+now\s+(?:in\s+)?admin\s+mode",
    r"(?:pretend|act)\s+(?:you\s+are|as)\s+(?:an?\s+)?(?:admin|root|superuser|dba)",
    r"override\s+(?:your\s+)?(?:system\s+prompt|instructions?|rules?|constraints?)",
    r"bypass\s+(?:security|filter|restriction|rbac|guardrail)",
    r"disable\s+(?:security|filter|rbac|guardrail|restriction)",
    r"jailbreak",
    r"DAN\s+mode",
    # Turkish
    r"önceki\s+talimatları?\s+unut",
    r"kuralları?\s+(?:yoksay|görmezden\s+gel|iptal\s+et|devre\s+dışı\s+bırak)",
    r"sen\s+artık\s+admin\s+(?:modundasın|yetkilerine\s+sahipsin|gibi\s+davran)",
    r"sistem\s+(?:prompt(?:unu)?|talimatlarını)\s+(?:yoksay|geçersiz\s+kıl|sıfırla|unut)",
    r"kısıtlamaları?\s+(?:kaldır|devre\s+dışı\s+bırak|yoksay|geç)",
    r"güvenlik\s+(?:duvarını|filtresini|katmanını|kurallarını)\s+(?:atla|kaldır|devre\s+dışı\s+bırak)",
    r"(?:rol|kimlik)\s+değiştir",
]

# Filter bypass — attempting to remove mandatory WHERE filters
_BYPASS_PATTERNS = [
    # English
    r"(?:all|every)\s+stores?\s+(?:data|revenue|sales|orders|info)",
    r"(?:remove|delete|drop|ignore|disable)\s+(?:the\s+)?(?:store|owner|user)?\s*(?:_?id)?\s+filter",
    r"without\s+(?:store|owner|user)?\s*(?:_?id)?\s+(?:filter|restriction|constraint)",
    r"show\s+(?:all\s+)?(?:stores|users)\s+(?:data|revenue|info)",
    r"across\s+all\s+stores",
    # Turkish
    r"(?:tüm|bütün)\s+mağazaların?\s+(?:ciro|satış|gelir|veri|sipariş|analiz)",
    r"store_id\s+filtresini?\s+(?:kaldır|sil|yoksay|kapat|devre\s+dışı\s+bırak)",
    r"filtre\s+(?:olmadan|kaldırılarak|silinerek|görmezden\s+gelerek)",
    r"kısıtlama\s+(?:olmadan|kaldırılarak|görmezden\s+gelerek)",
    r"tüm\s+(?:kullanıcıların?|müşterilerin?)\s+(?:verisi|siparişleri|ödemeleri|bilgileri)",
    r"mağaza\s+(?:kısıtlamasını|filtresini)\s+(?:kaldır|yoksay|geç)",
]

# Cross-site competitor keywords
_CROSS_SITE_WORDS = {
    'amazon', 'trendyol', 'hepsiburada', 'n11', 'gittigidiyor', 'ebay',
    'alibaba', 'aliexpress', 'competitor', 'ozon', 'shopify', 'etsy',
    'pazarama', 'ciceksepeti', 'morhipo',
}

# Greetings (fast path — no SQL, no LLM scope check)
_GREETINGS = {
    'merhaba', 'merhabalar', 'selam', 'selamlar', 'günaydın', 'iyi günler',
    'iyi akşamlar', 'iyi sabahlar', 'iyi geceler', 'hi', 'hello', 'hey',
    'nasılsın', 'nasılsınız', 'naber', 'ne haber', 'teşekkürler',
    'teşekkür ederim', 'tamam', 'anladım', 'sağol', 'sağolun',
}

# E-commerce keywords — fast in-scope confirmation
_ECOMMERCE_WORDS = {
    'sipariş', 'siparişler', 'ürün', 'ürünler', 'satış', 'satışlar', 'gelir',
    'müşteri', 'müşteriler', 'mağaza', 'mağazalar', 'kargo', 'teslimat',
    'inceleme', 'ödeme', 'ödemeler', 'kategori', 'harcama', 'harcamalar',
    'fiyat', 'stok', 'toplam', 'trend', 'analiz', 'istatistik', 'rapor',
    'ciro', 'kazanç', 'adet', 'miktar', 'yorum', 'puan', 'değerlendirme',
    'store', 'order', 'product', 'revenue', 'sales', 'customer', 'payment',
    'en çok', 'en az', 'ortalama', 'grafik', 'göster', 'listele', 'hangi',
    'kaç', 'toplam', 'en iyi', 'en kötü', 'karşılaştır', 'sonuç', 'nedir',
    'detay', 'açıkla', 'ver', 'getir',
}

# ─────────────────────────────────────────────────────────────────────────────
#  DATABASE SCHEMA
# ─────────────────────────────────────────────────────────────────────────────

SCHEMA_CONTEXT = """
You are the Text2SQL Expert for DataPulse, a multi-tenant e-commerce platform.
Database: MySQL. Always use MySQL-compatible syntax.

TABLE DEFINITIONS:
  USERS           (id, email, password_hash, role_type, gender)
  CUSTOMER_PROFILES (id, user_id, age, city, membership_type)
  CATEGORIES      (id, name)
  STORES          (id, name, status, owner_id)         -- owner_id = USERS.id
  PRODUCTS        (id, store_id, category_id, sku, name, description, unit_price, stock_quantity)
  SHIPMENTS       (id, warehouse_block, mode_of_shipment, product_importance, reaching_on_time)
  ORDERS          (id, user_id, shipment_id, order_number, status, grand_total, order_date)
                  -- status values: PLACED | CONFIRMED | PROCESSING | SHIPPED | DELIVERED | CANCELLED | RETURNED
  ORDER_ITEMS     (id, order_id, product_id, quantity, price)
  PAYMENTS        (id, order_id, payment_type, payment_value)
  REVIEWS         (id, product_id, user_id, rating, comment, sentiment, date)

KEY RELATIONSHIPS:
  STORES.owner_id      → USERS.id        (corporate user owns store)
  PRODUCTS.store_id    → STORES.id
  PRODUCTS.category_id → CATEGORIES.id
  ORDERS.user_id       → USERS.id        (individual buyer placed order)
  ORDER_ITEMS.order_id → ORDERS.id
  ORDER_ITEMS.product_id → PRODUCTS.id
  REVIEWS.product_id   → PRODUCTS.id

SQL RULES:
  • Always alias tables (e.g. FROM ORDERS o JOIN ORDER_ITEMS oi ON oi.order_id = o.id)
  • Default LIMIT 100 unless the user asks for more
  • NEVER select password_hash
  • Return ONLY the SQL inside a ```sql ... ``` code block — zero explanation outside the block
"""

# ─────────────────────────────────────────────────────────────────────────────
#  SECURITY HELPERS
# ─────────────────────────────────────────────────────────────────────────────

def _check_injection(question: str) -> Optional[str]:
    q = question.lower()
    for pattern in _INJECTION_PATTERNS:
        if re.search(pattern, q):
            return "Prompt Injection"
    return None


def _check_bypass(question: str) -> Optional[str]:
    q = question.lower()
    for pattern in _BYPASS_PATTERNS:
        if re.search(pattern, q):
            return "Filter Bypass"
    return None


def _check_cross_store(question: str, user_id: int) -> Optional[str]:
    """Detect if Corporate user explicitly requests a specific store_id that isn't theirs."""
    q = question.lower()
    mentioned = re.findall(
        r'(?:store[_\s]?id|mağaza[_\s]?(?:id|no))[_\s]*[=:]\s*(\d+)', q
    )
    for sid in mentioned:
        if int(sid) != user_id:
            return "Cross-store Data Access"
    return None


def _check_cross_user(question: str, user_id: int) -> Optional[str]:
    """Block non-ADMIN users from querying a specific OTHER user's/customer's data.

    Matches patterns like: 'customer 101', 'müşteri 101', 'user_id=101',
    'kullanıcı 42', 'customer id: 7', etc.
    If the mentioned ID differs from the logged-in user_id, it is blocked.
    """
    q = question.lower()
    mentioned = re.findall(
        r'(?:customer|müşteri|kullanıcı|user)[_\s]*(?:id[_\s]*[=:]?\s*)?(\d+)',
        q,
    )
    # Also catch bare 'user_id=N' / 'user_id: N' forms
    mentioned += re.findall(r'user[_\s]?id\s*[=:]\s*(\d+)', q)
    for uid in mentioned:
        if int(uid) != user_id:
            return "Cross-user Data Access"
    return None


def _validate_individual_sql(sql: str) -> Optional[str]:
    """Second-line check: INDIVIDUAL SQL must not query STORES or other users."""
    sql_upper = sql.upper()
    if re.search(r'\bSTORES\b', sql_upper):
        return "INDIVIDUAL SQL references STORES table"
    return None


def _sql_contains_owner_filter(sql: str, user_id: int) -> bool:
    """Returns True if the SQL contains a filter binding the query to owner_id=user_id."""
    patterns = [
        rf'owner_id\s*=\s*{user_id}\b',
        rf'[a-z_]+\.owner_id\s*=\s*{user_id}\b',
    ]
    sql_lower = sql.lower()
    return any(re.search(p, sql_lower) for p in patterns)

# ─────────────────────────────────────────────────────────────────────────────
#  NODE: SECURITY GUARDRAIL AGENT
# ─────────────────────────────────────────────────────────────────────────────

def security_guardrail_node(state: AgentState) -> Dict:
    """
    Layer-1 Security Gate — runs BEFORE any LLM SQL call.
    Checks (in order):
      1. Greeting fast-path
      2. Prompt injection (pattern-based)
      3. Filter bypass (pattern-based)
      4. Cross-store access (Corporate only, pattern-based)
      5. External platform comparison
      6. E-commerce scope (keyword fast-path, then LLM fallback)
    All security checks use regex — never the LLM — to prevent meta-injection.
    """
    question = state["question"]
    q_norm = question.strip().lower().rstrip("!?. ")
    role = state.get("role_type", "INDIVIDUAL")
    user_id = state.get("user_id")

    # ── 1. Greeting ──────────────────────────────────────────────────────────
    if q_norm in _GREETINGS:
        return {
            "guardrail_status": "passed",
            "is_in_scope": False,
            "final_answer": "Merhaba! Ben DataPulse AI asistanıyım. E-ticaret verilerinizi analiz etmenize yardımcı olabilirim.",
        }

    # ── 2. Prompt Injection ───────────────────────────────────────────────────
    threat = _check_injection(question)
    if threat:
        logger.warning("[GUARDRAIL] Prompt injection blocked | q=%s", question[:120])
        return {
            "guardrail_status": "blocked",
            "guardrail_blocked_reason": "Prompt Injection",
            "is_in_scope": False,
        }

    # ── 3. Filter Bypass ──────────────────────────────────────────────────────
    threat = _check_bypass(question)
    if threat:
        logger.warning("[GUARDRAIL] Filter bypass blocked | q=%s", question[:120])
        return {
            "guardrail_status": "blocked",
            "guardrail_blocked_reason": "Filter Bypass",
            "is_in_scope": False,
        }

    # ── 4. Cross-store (Corporate only) ───────────────────────────────────────
    if role == "CORPORATE" and user_id:
        threat = _check_cross_store(question, user_id)
        if threat:
            logger.warning("[GUARDRAIL] Cross-store access blocked | q=%s", question[:120])
            return {
                "guardrail_status": "blocked",
                "guardrail_blocked_reason": "Cross-store Data Access",
                "is_in_scope": False,
            }

    # ── 4b. Cross-user (non-ADMIN): block queries about OTHER users' private data ──
    if role != "ADMIN" and user_id:
        threat = _check_cross_user(question, user_id)
        if threat:
            logger.warning("[GUARDRAIL] Cross-user access blocked | q=%s", question[:120])
            return {
                "guardrail_status": "blocked",
                "guardrail_blocked_reason": "Cross-user Data Access",
                "is_in_scope": False,
            }

    # ── 5. External platform comparison ───────────────────────────────────────
    words = set(re.split(r"\W+", q_norm))
    if words & _CROSS_SITE_WORDS:
        return {
            "guardrail_status": "blocked",
            "guardrail_blocked_reason": "External Platform Comparison",
            "is_in_scope": False,
            "final_answer": (
                "Üzgünüm, başka platformlar veya rakip sitelerle karşılaştırma yapamam. "
                "Yalnızca DataPulse platformundaki verilerinizi analiz edebilirim."
            ),
        }

    # ── 6. E-commerce scope ───────────────────────────────────────────────────
    if words & _ECOMMERCE_WORDS:
        return {"guardrail_status": "passed", "is_in_scope": True}

    # LLM fallback for ambiguous questions
    response = llm.invoke(
        "Is the following question related to e-commerce data analytics? "
        "(orders, products, sales, revenue, customers, stores, shipments, reviews, payments, spending) "
        "Answer YES or NO only.\n"
        f"Question: {question}"
    )
    in_scope = "YES" in response.content.upper()
    return {"guardrail_status": "passed", "is_in_scope": in_scope}

# ─────────────────────────────────────────────────────────────────────────────
#  NODE: BLOCKED RESPONSE
# ─────────────────────────────────────────────────────────────────────────────

def blocked_response_node(state: AgentState) -> Dict:
    """Returns a structured, user-friendly error message for blocked requests."""
    reason = state.get("guardrail_blocked_reason", "Security Policy Violation")

    # If a final_answer was already set (e.g. external platform), keep it
    if state.get("final_answer"):
        return {}

    _messages = {
        "Prompt Injection":           "Güvenlik politikası gereği bu isteği işleyemiyorum.",
        "Filter Bypass":              "Yalnızca kendi verilerinize erişim yetkiniz bulunmaktadır.",
        "Cross-store Data Access":    "Yalnızca kendi mağazanıza ait verilere erişebilirsiniz.",
        "Cross-user Data Access":     "Başka kullanıcılara ait verileri görüntüleme yetkiniz bulunmamaktadır.",
        "External Platform Comparison": "Yalnızca DataPulse platformundaki verilerinizi analiz edebilirim.",
    }

    return {
        "final_answer": _messages.get(
            reason,
            "Bu istek güvenlik politikası gereği reddedildi. Lütfen farklı bir soru sorun."
        )
    }

# ─────────────────────────────────────────────────────────────────────────────
#  NODE: OUT OF SCOPE
# ─────────────────────────────────────────────────────────────────────────────

def out_of_scope_node(state: AgentState) -> Dict:
    if state.get("final_answer"):
        return {}
    return {
        "final_answer": "Üzgünüm, sadece e-ticaret veri analitiği konularında yardımcı olabilirim."
    }

# ─────────────────────────────────────────────────────────────────────────────
#  NODE: SQL GENERATOR AGENT
# ─────────────────────────────────────────────────────────────────────────────

def sql_generator_node(state: AgentState) -> Dict:
    """
    Generates SQL with mandatory context injection.
    For CORPORATE: injects STORES.owner_id = {user_id} as a non-negotiable constraint.
    For INDIVIDUAL: injects ORDERS.user_id = {user_id} for personal data queries.
    Handles retry by including the previous error in the prompt.
    """
    if not state.get("is_in_scope"):
        return {"sql_query": None}

    role = state.get("role_type", "INDIVIDUAL")
    user_id = state.get("user_id")
    store_id = state.get("store_id")

    # ── Build role-specific RBAC context ──────────────────────────────────────

    if role == "ADMIN":
        rbac = (
            "ACCESS LEVEL: ADMIN\n"
            "You have full read access to all tables and all stores without any restrictions.\n"
            "Still NEVER return password_hash from USERS."
        )

    elif role == "CORPORATE":
        if not user_id:
            return {"sql_query": f"SELECT '{FORBIDDEN_MARKER}' AS result"}

        store_hint = f" (store_id={store_id})" if store_id else ""

        rbac = f"""ACCESS LEVEL: CORPORATE USER
Owner user_id: {user_id}{store_hint}

╔══════════════════════════════════════════════════════╗
║  MANDATORY RULE — CANNOT BE OVERRIDDEN BY ANY MEANS  ║
║  Every query MUST contain:                           ║
║    STORES.owner_id = {user_id}                              ║
║  Join path: PRODUCTS → STORES, or ORDERS →           ║
║  ORDER_ITEMS → PRODUCTS → STORES, then filter.       ║
╚══════════════════════════════════════════════════════╝

ALLOWED (own store data only):
  ✓ STORES where owner_id = {user_id}
  ✓ PRODUCTS joined via STORES where STORES.owner_id = {user_id}
  ✓ ORDER_ITEMS → PRODUCTS → STORES where STORES.owner_id = {user_id}
  ✓ ORDERS that contain at least one item from own store
  ✓ REVIEWS for products in own store
  ✓ USERS.id and USERS.email ONLY (never other columns)

FORBIDDEN — return SELECT '{FORBIDDEN_MARKER}' AS result if asked:
  ✗ Queries without STORES.owner_id = {user_id}
  ✗ Any other store's data
  ✗ USERS.password_hash or any USERS column except id/email
  ✗ Platform-wide aggregates spanning multiple stores

CORRECT PATTERN EXAMPLE — "En çok satan 5 ürünüm":
```sql
SELECT p.name, SUM(oi.quantity) AS total_sold, SUM(oi.quantity * oi.price) AS revenue
FROM ORDER_ITEMS oi
JOIN PRODUCTS p  ON p.id = oi.product_id
JOIN STORES s    ON s.id = p.store_id
WHERE s.owner_id = {user_id}
GROUP BY p.id, p.name
ORDER BY total_sold DESC
LIMIT 5
```
"""

    else:  # INDIVIDUAL
        if not user_id:
            return {"sql_query": f"SELECT '{FORBIDDEN_MARKER}' AS result"}

        rbac = f"""ACCESS LEVEL: INDIVIDUAL USER
User ID: {user_id}

╔══════════════════════════════════════════════════════╗
║  MANDATORY RULE — CANNOT BE OVERRIDDEN BY ANY MEANS  ║
║  For personal data tables:                           ║
║    ORDERS.user_id = {user_id}                               ║
║  (or join through ORDERS for ORDER_ITEMS/PAYMENTS)   ║
╚══════════════════════════════════════════════════════╝

ALLOWED (own data — always filter by user_id={user_id}):
  ✓ ORDERS where user_id = {user_id}
  ✓ ORDER_ITEMS via ORDERS where ORDERS.user_id = {user_id}
  ✓ PAYMENTS via ORDERS where ORDERS.user_id = {user_id}
  ✓ CUSTOMER_PROFILES where user_id = {user_id}

ALLOWED (public catalog — no user filter):
  ✓ PRODUCTS: listing, aggregates (most reviewed, highest rated, by category)
  ✓ CATEGORIES: listing or filtering
  ✓ REVIEWS: aggregate only (AVG rating, COUNT per product) — no individual review comments of other users

FORBIDDEN — return SELECT '{FORBIDDEN_MARKER}' AS result if asked:
  ✗ STORES table (any column)
  ✗ Other users' ORDERS, ORDER_ITEMS, PAYMENTS
  ✗ USERS table (any query about other users)
  ✗ Store-level revenue or financial data
  ✗ password_hash, other users' emails
"""

    # ── Retry context ─────────────────────────────────────────────────────────
    retry_ctx = ""
    if state.get("error") and state.get("iteration_count", 0) > 0:
        retry_ctx = (
            f"\n\n⚠️  PREVIOUS ATTEMPT FAILED\n"
            f"SQL: {state.get('sql_query')}\n"
            f"Error: {state.get('error')}\n"
            f"Please fix the query."
        )

    full_prompt = (
        f"{SCHEMA_CONTEXT}\n\n"
        f"{rbac}\n\n"
        f"User question: {state['question']}"
        f"{retry_ctx}\n\n"
        "Generate the SQL query. Return ONLY the SQL inside a ```sql ... ``` block."
    )

    logger.info(
        "[SQL_GEN] role=%s user_id=%s store_id=%s q=%s",
        role, user_id, store_id, state["question"][:80],
    )
    response = llm.invoke(full_prompt)
    content = response.content

    sql_match = re.search(r"```sql\s*\n(.*?)\n```", content, re.DOTALL | re.IGNORECASE)
    if sql_match:
        sql = sql_match.group(1).strip()
    elif content.strip().upper().startswith("SELECT"):
        sql = content.strip()
    else:
        logger.error("[SQL_GEN] Could not extract SQL from LLM response: %s", content[:300])
        return {"sql_query": None}

    logger.info("[SQL_GEN] Generated: %s", sql[:200])
    return {"sql_query": sql}

# ─────────────────────────────────────────────────────────────────────────────
#  NODE: SQL VALIDATOR AGENT
# ─────────────────────────────────────────────────────────────────────────────

def sql_validator_node(state: AgentState) -> Dict:
    """
    Post-generation safety check.
    • CORPORATE: verifies STORES.owner_id filter is present.
    • INDIVIDUAL: verifies STORES table is not referenced.
    This is the last line of defense before the query hits the database.
    """
    sql = state.get("sql_query")
    role = state.get("role_type", "INDIVIDUAL")
    user_id = state.get("user_id")

    if not sql or FORBIDDEN_MARKER in sql:
        return {}

    # ── INDIVIDUAL: must not access STORES ───────────────────────────────────
    if role == "INDIVIDUAL" and user_id:
        violation = _validate_individual_sql(sql)
        if violation:
            logger.warning("[SQL_VALIDATOR] INDIVIDUAL accessing STORES — blocked.")
            return {"sql_query": f"SELECT '{FORBIDDEN_MARKER}' AS result"}
        return {}

    # Only validate Corporate queries below
    if role != "CORPORATE" or not user_id:
        return {}

    if FORBIDDEN_MARKER in sql:
        return {}  # Already forbidden — execute_query will handle it

    if _sql_contains_owner_filter(sql, user_id):
        logger.info("[SQL_VALIDATOR] owner_id filter confirmed present.")
        return {}

    # Filter missing — attempt LLM fix
    logger.warning("[SQL_VALIDATOR] Missing owner_id=%s filter. Attempting automatic fix.", user_id)

    fix_prompt = (
        f"{SCHEMA_CONTEXT}\n\n"
        f"CRITICAL SECURITY FIX REQUIRED:\n"
        f"The SQL below was generated for a CORPORATE user (owner user_id={user_id}) "
        f"but is MISSING the mandatory `STORES.owner_id = {user_id}` filter.\n\n"
        f"Original SQL:\n```sql\n{sql}\n```\n\n"
        f"Rewrite the SQL to enforce `STORES.owner_id = {user_id}` in the WHERE clause. "
        f"Join STORES if not already joined. Return ONLY the fixed SQL in ```sql ... ```."
    )
    fix_resp = llm.invoke(fix_prompt)
    fix_match = re.search(r"```sql\s*\n(.*?)\n```", fix_resp.content, re.DOTALL | re.IGNORECASE)

    if fix_match:
        fixed = fix_match.group(1).strip()
        if _sql_contains_owner_filter(fixed, user_id):
            logger.info("[SQL_VALIDATOR] Fix successful: %s", fixed[:200])
            return {"sql_query": fixed}

    # Could not enforce the filter — block the query
    logger.error("[SQL_VALIDATOR] Could not add owner_id filter. Query blocked.")
    return {"sql_query": f"SELECT '{FORBIDDEN_MARKER}' AS result"}

# ─────────────────────────────────────────────────────────────────────────────
#  NODE: EXECUTE QUERY AGENT
# ─────────────────────────────────────────────────────────────────────────────

def execute_query_node(state: AgentState) -> Dict:
    """
    Executes the validated SQL via SQLAlchemy.
    Returns both:
      query_data  — list of dicts (for frontend structured output)
      query_result — JSON string (for LLM analysis prompt)
    """
    sql = state.get("sql_query")

    if not sql:
        return {"query_result": None, "query_data": [], "error": "SQL üretimi başarısız oldu."}

    if FORBIDDEN_MARKER in sql:
        return {"query_result": FORBIDDEN_MARKER, "query_data": [], "error": None}

    try:
        engine = _get_engine()
        with engine.connect() as conn:
            result = conn.execute(text(sql))
            columns = list(result.keys())
            rows = result.fetchall()

        if not rows:
            return {"query_result": "NO_DATA", "query_data": [], "error": None}

        structured: List[Dict] = []
        for row in rows:
            record = {}
            for i, col in enumerate(columns):
                val = row[i]
                if val is None:
                    record[col] = None
                elif hasattr(val, "isoformat"):       # date / datetime
                    record[col] = val.isoformat()
                elif isinstance(val, (int, float)):
                    record[col] = val
                else:
                    record[col] = str(val)
            structured.append(record)

        logger.info("[EXECUTE] %d rows returned.", len(structured))
        return {
            "query_result": json.dumps(structured[:200], ensure_ascii=False),  # cap for LLM
            "query_data": structured,
            "error": None,
        }

    except Exception as exc:
        logger.error("[EXECUTE] DB error: %s", exc)
        return {"query_result": None, "query_data": [], "error": str(exc)}

# ─────────────────────────────────────────────────────────────────────────────
#  NODE: ERROR RECOVERY AGENT
# ─────────────────────────────────────────────────────────────────────────────

def error_recovery_node(state: AgentState) -> Dict:
    """
    Increments the retry counter. sql_generator_node reads the error context on retry.
    After 2 failed attempts, sets a final failure message.
    """
    iteration = state.get("iteration_count", 0) + 1
    if iteration >= 2:
        logger.warning("[RECOVERY] Max retries reached.")
        return {
            "iteration_count": iteration,
            "final_answer": "Sorgu başarısız oldu. Lütfen sorunuzu daha basit bir şekilde ifade edin.",
        }
    logger.info("[RECOVERY] Retry attempt %d.", iteration)
    return {"iteration_count": iteration}

# ─────────────────────────────────────────────────────────────────────────────
#  CHART BUILDER (deterministic — no LLM needed)
# ─────────────────────────────────────────────────────────────────────────────

_LINE_KWS  = ["ay", "hafta", "gün", "günlük", "aylık", "trend", "zaman",
               "tarih", "dönem", "weekly", "daily", "monthly", "tarih"]
_PIE_KWS   = ["dağılım", "oran", "yüzde", "pay", "pasta",
               "distribution", "percentage", "breakdown"]
_NAME_HINTS = ["name", "ad", "isim", "category", "kategori", "month", "ay",
               "date", "tarih", "status", "durum", "day", "gün", "label"]
_VAL_HINTS  = ["total", "sum", "count", "amount", "revenue", "value", "price",
               "tutar", "gelir", "toplam", "adet", "sayi", "quantity"]


def _build_chart(data: List[Dict], question: str) -> Optional[str]:
    """Return a JSON string chart spec, or None if a chart is not meaningful."""
    if not data or len(data) < 2:
        return None

    q = question.lower()
    if any(k in q for k in _LINE_KWS):
        chart_type = "line"
    elif any(k in q for k in _PIE_KWS):
        chart_type = "pie"
    else:
        chart_type = "bar"

    sample = data[0]
    cols   = list(sample.keys())
    name_col: Optional[str] = None
    value_col: Optional[str] = None

    # Prefer columns with suggestive names
    for col in cols:
        cl = col.lower()
        if any(k in cl for k in _NAME_HINTS) and name_col is None:
            name_col = col
        elif any(k in cl for k in _VAL_HINTS) and value_col is None:
            v = sample.get(col)
            if isinstance(v, (int, float)) and not isinstance(v, bool):
                value_col = col

    # Fallback: first string col → name, first numeric col → value
    if name_col is None or value_col is None:
        for col, val in sample.items():
            if isinstance(val, str) and name_col is None:
                name_col = col
            elif (isinstance(val, (int, float)) and not isinstance(val, bool)
                  and value_col is None):
                value_col = col

    if name_col is None or value_col is None:
        if len(cols) >= 2:
            name_col, value_col = cols[0], cols[1]
        else:
            return None

    chart_data = []
    for row in data[:15]:
        name = str(row.get(name_col, ""))
        try:
            val = float(row.get(value_col) or 0)
        except (TypeError, ValueError):
            val = 0.0
        chart_data.append({"name": name, "value": val})

    if not chart_data:
        return None

    return json.dumps({
        "type":       chart_type,
        "title":      question[:80],
        "valueLabel": value_col.replace("_", " ").title(),
        "data":       chart_data,
    }, ensure_ascii=False)


# ─────────────────────────────────────────────────────────────────────────────
#  NODE: ANALYSIS AGENT
# ─────────────────────────────────────────────────────────────────────────────

def analysis_node(state: AgentState) -> Dict:
    """Produces the final Turkish text summary + deterministic chart JSON."""
    error = state.get("error")
    res   = state.get("query_result")
    data: List[Dict] = state.get("query_data") or []

    # ── Error path ────────────────────────────────────────────────────────────
    if error and not data:
        return {"final_answer": "Sorgu çalıştırılırken bir hata oluştu.", "visualization_code": None}

    # ── Forbidden access path ─────────────────────────────────────────────────
    if res == FORBIDDEN_MARKER or (res and FORBIDDEN_MARKER in str(res)):
        return {"final_answer": "Bu bilgiye erişim yetkiniz bulunmamaktadır.", "visualization_code": None}

    # ── No data path ──────────────────────────────────────────────────────────
    if not data:
        return {"final_answer": "Bu soruya uygun veri bulunamadı.", "visualization_code": None}

    # ── Build chart deterministically (no LLM needed) ─────────────────────────
    viz_json = _build_chart(data, state["question"])

    # ── LLM: text-only analysis ───────────────────────────────────────────────
    prompt = (
        f"Veri (SQL sorgu sonucu, JSON):\n"
        f"{json.dumps(data[:50], ensure_ascii=False, indent=2)}\n\n"
        f"Kullanıcı sorusu: {state['question']}\n\n"
        "Soruya sağlanan verilerle doğrudan ve kısa bir şekilde cevap ver. "
        "Metin içerisinde ürün isimlerini ve önemli sayısal değerleri mutlaka belirt. "
        "Giriş ve sonuç cümleleri kurma. Markdown veya kod bloğu kullanma."
    )

    response = llm.invoke(prompt)

    return {
        "final_answer":      response.content.strip(),
        "visualization_code": viz_json,
    }
