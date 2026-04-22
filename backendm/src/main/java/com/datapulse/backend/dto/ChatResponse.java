package com.datapulse.backend.dto;

public class ChatResponse {
    private String reply;           // AI'nın doğal dil açıklaması
    private Object visualization;   // Plotly/HTML grafik kodu (varsa)
    private String sqlQuery;        // Arka planda üretilen SQL (debug için opsiyonel)

    public ChatResponse() {}

    public ChatResponse(String reply, Object visualization, String sqlQuery) {
        this.reply = reply;
        this.visualization = visualization;
        this.sqlQuery = sqlQuery;
    }

    // --- Getters & Setters ---
    public String getReply() { return reply; }
    public void setReply(String reply) { this.reply = reply; }
    public Object getVisualization() { return visualization; }
    public void setVisualization(Object visualization) { this.visualization = visualization; }
    public String getSqlQuery() { return sqlQuery; }
    public void setSqlQuery(String sqlQuery) { this.sqlQuery = sqlQuery; }
}
