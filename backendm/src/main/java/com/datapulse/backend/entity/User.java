package com.datapulse.backend.entity;

import java.util.List;

import com.fasterxml.jackson.annotation.JsonIgnore;
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

    @Column(name = "full_name")
    private String fullName; // DS6 review_headline veya isme göre

    @Column(name = "gender")
    private String gender;

    @Column(name = "phone")
    private String phone;

    @OneToOne(mappedBy = "user", cascade = CascadeType.ALL)
    @JsonIgnore
    private CustomerProfile profile;

    @OneToMany(mappedBy = "owner")
    @JsonIgnore
    private List<Store> stores;

    @OneToMany(mappedBy = "user", cascade = CascadeType.ALL)
    @JsonIgnore
    private List<Order> orders;

    public User() {}

    public User(String email, String passwordHash, String roleType, String gender) {
        this.email = email;
        this.passwordHash = passwordHash;
        this.roleType = roleType;
        this.gender = gender;
    }

    public User(String email, String passwordHash, String roleType, String gender, String fullName) {
        this.email = email;
        this.passwordHash = passwordHash;
        this.roleType = roleType;
        this.gender = gender;
        this.fullName = fullName;
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
    public String getFullName() { return fullName; }
    public void setFullName(String fullName) { this.fullName = fullName; }
    public String getGender() { return gender; }
    public void setGender(String gender) { this.gender = gender; }
    public String getPhone() { return phone; }
    public void setPhone(String phone) { this.phone = phone; }
    public CustomerProfile getProfile() { return profile; }
    public void setProfile(CustomerProfile profile) { this.profile = profile; }
    public List<Store> getStores() { return stores; }
    public void setStores(List<Store> stores) { this.stores = stores; }
    public List<Order> getOrders() { return orders; }
    public void setOrders(List<Order> orders) { this.orders = orders; }
}