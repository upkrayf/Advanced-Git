package com.datapulse.backend.dto;

public class AuthResponse {
    private String token;
    private String refreshToken;
    private String role;

    public AuthResponse(String token, String refreshToken, String role) {
        this.token = token;
        this.refreshToken = refreshToken;
        this.role = role;
    }

    // Getter ve Setter'lar
    public String getToken() { return token; }
    public void setToken(String token) { this.token = token; }
    public String getRefreshToken() { return refreshToken; }
    public void setRefreshToken(String refreshToken) { this.refreshToken = refreshToken; }
    public String getRole() { return role; }
    public void setRole(String role) { this.role = role; }
}