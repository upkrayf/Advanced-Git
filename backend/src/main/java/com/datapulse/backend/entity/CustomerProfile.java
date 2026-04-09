package com.datapulse.backend.entity;

import jakarta.persistence.*;

@Entity
@Table(name = "customer_profiles")
public class CustomerProfile {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private Integer age;
    private String city;

    @Column(name = "membership_type")
    private String membershipType; // Gold, Silver, Premium

    @OneToOne
    @JoinColumn(name = "user_id")
    private User user;

    public CustomerProfile() {}

    // Getter ve Setterlar
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public Integer getAge() { return age; }
    public void setAge(Integer age) { this.age = age; }
    public String getCity() { return city; }
    public void setCity(String city) { this.city = city; }
    public String getMembershipType() { return membershipType; }
    public void setMembershipType(String membershipType) { this.membershipType = membershipType; }
    public User getUser() { return user; }
    public void setUser(User user) { this.user = user; }
}