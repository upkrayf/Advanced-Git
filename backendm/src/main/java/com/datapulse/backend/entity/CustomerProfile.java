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
    private String membershipType; // Gold, Silver, Bronze, Premium

    @Column(name = "total_spend")
    private Double totalSpend; // DS2: Total Spend

    @Column(name = "items_purchased")
    private Integer itemsPurchased; // DS2: Items Purchased

    @Column(name = "average_rating")
    private Double averageRating; // DS2: Average Rating

    @Column(name = "discount_applied")
    private Boolean discountApplied; // DS2: Discount Applied

    @Column(name = "days_since_last_purchase")
    private Integer daysSinceLastPurchase; // DS2: Days Since Last Purchase

    @Column(name = "satisfaction_level")
    private String satisfactionLevel; // DS2: Satisfaction Level (Satisfied, Neutral, Unsatisfied)

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
    public Double getTotalSpend() { return totalSpend; }
    public void setTotalSpend(Double totalSpend) { this.totalSpend = totalSpend; }
    public Integer getItemsPurchased() { return itemsPurchased; }
    public void setItemsPurchased(Integer itemsPurchased) { this.itemsPurchased = itemsPurchased; }
    public Double getAverageRating() { return averageRating; }
    public void setAverageRating(Double averageRating) { this.averageRating = averageRating; }
    public Boolean getDiscountApplied() { return discountApplied; }
    public void setDiscountApplied(Boolean discountApplied) { this.discountApplied = discountApplied; }
    public Integer getDaysSinceLastPurchase() { return daysSinceLastPurchase; }
    public void setDaysSinceLastPurchase(Integer daysSinceLastPurchase) { this.daysSinceLastPurchase = daysSinceLastPurchase; }
    public String getSatisfactionLevel() { return satisfactionLevel; }
    public void setSatisfactionLevel(String satisfactionLevel) { this.satisfactionLevel = satisfactionLevel; }
    public User getUser() { return user; }
    public void setUser(User user) { this.user = user; }
}