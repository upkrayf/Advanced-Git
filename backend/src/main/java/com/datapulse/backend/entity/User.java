package com.datapulse.backend.entity;

import jakarta.persistence.*;

@Entity
@Table(name = "users")
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String email;

    @Column(name = "password_hash", nullable = false)
    private String passwordHash;

    @Column(name = "role_type", nullable = false)
    private String roleType; // ADMIN, CORPORATE, INDIVIDUAL

    @Column(name = "gender")
    private String gender; // DS2'den gelecek (Male, Female)

    public User() {}

    public User(String email, String passwordHash, String roleType, String gender) {
        this.email = email;
        this.passwordHash = passwordHash;
        this.roleType = roleType;
        this.gender = gender;
    }

    // --- GETTER VE SETTERLAR ---
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }
    public String getPasswordHash() { return passwordHash; }
    public void setPasswordHash(String passwordHash) { this.passwordHash = passwordHash; }
    public String getRoleType() { return roleType; }
    public void setRoleType(String roleType) { this.roleType = roleType; }
    public String getGender() { return gender; }
    public void setGender(String gender) { this.gender = gender; }
}