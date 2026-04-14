package com.datapulse.backend.dto;

public class AuthResponse {
    private String token;
    private String refreshToken;
    private String roleType;

    public AuthResponse(String token, String refreshToken, String roleType) {
        this.token = token;
        this.refreshToken = refreshToken;
        this.roleType = roleType;
    }

    public String getToken() { return token; }
    public void setToken(String token) { this.token = token; }
    public String getRefreshToken() { return refreshToken; }
    public void setRefreshToken(String refreshToken) { this.refreshToken = refreshToken; }
    public String getRoleType() { return roleType; }
    public void setRoleType(String roleType) { this.roleType = roleType; }
}