from typing import TypedDict, Optional

class AgentState(TypedDict):
    question: str              # Kullanıcının sorusu
    sql_query: Optional[str]   # Üretilen SQL
    query_result: Optional[str]# DB'den dönen veri
    error: Optional[str]       # Varsa hata mesajı
    final_answer: Optional[str]# Analiz sonucunda oluşan cevap
    visualization_code: Optional[str] # Plotly kodu
    is_in_scope: bool          # Soru e-ticaretle mi ilgili?
    iteration_count: int       # Hata düzeltme deneme sayısı
    user_id: Optional[int]     # Kullanıcı ID
    role_type: Optional[str]   # ADMIN, CORPORATE, INDIVIDUAL