package com.datapulse.backend.dto;

public class RegisterRequest {
    private String email;
    private String password;
    private String roleType; // INDIVIDUAL, CORPORATE vb.

    // Getter ve Setter'lar
    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }
    public String getPassword() { return password; }
    public void setPassword(String password) { this.password = password; }
    public String getRoleType() { return roleType; }
    public void setRoleType(String roleType) { this.roleType = roleType; }
}