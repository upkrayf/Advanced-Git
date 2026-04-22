package com.datapulse.backend.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Entity
@Table(name = "orders")
public class Order {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "order_number")
    private String orderNumber; // DS1'deki InvoiceNo veya DS4'teki OrderID

    private LocalDateTime orderDate;
    @Column(name = "total_amount")
    private BigDecimal totalAmount; // DS5'teki GrandTotal
    private String status;        // DS4/5'teki Status

    @ManyToOne
    @JoinColumn(name = "user_id")
    @JsonIgnore
    private User user;

    @OneToOne(cascade = CascadeType.ALL)
    @JoinColumn(name = "shipment_id")
    private Shipment shipment;

    @OneToMany(mappedBy = "order", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<OrderItem> items;

    @OneToMany(mappedBy = "order", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<Payment> payments;

    public Order() {
        this.orderDate = LocalDateTime.now();
        this.totalAmount = BigDecimal.ZERO;
    }

    // Getter ve Setter'lar
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getOrderNumber() { return orderNumber; }
    public void setOrderNumber(String orderNumber) { this.orderNumber = orderNumber; }
    public LocalDateTime getOrderDate() { return orderDate; }
    public void setOrderDate(LocalDateTime orderDate) { this.orderDate = orderDate; }
    public BigDecimal getTotalAmount() { return totalAmount; }
    public void setTotalAmount(BigDecimal totalAmount) { this.totalAmount = totalAmount; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public User getUser() { return user; }
    public void setUser(User user) { this.user = user; }
    public Shipment getShipment() { return shipment; }
    public void setShipment(Shipment shipment) { this.shipment = shipment; }
    public List<OrderItem> getItems() { return items; }
    public void setItems(List<OrderItem> items) { this.items = items; }
    public List<Payment> getPayments() { return payments; }
    public void setPayments(List<Payment> payments) { this.payments = payments; }

    // --- Frontend Uyumluluğu İçin Ek Alanlar ---

    @com.fasterxml.jackson.annotation.JsonProperty("createdAt")
    public String getCreatedAt() {
        return orderDate != null ? orderDate.format(java.time.format.DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss")) : null;
    }

    @com.fasterxml.jackson.annotation.JsonProperty("storeName")
    public String getStoreName() {
        if (items != null && !items.isEmpty() && items.get(0).getProduct() != null && items.get(0).getProduct().getStore() != null) {
            return items.get(0).getProduct().getStore().getName();
        }
        return "Genel Mağaza";
    }

    @com.fasterxml.jackson.annotation.JsonProperty("customerName")
    public String getCustomerName() {
        return user != null ? (user.getFullName() != null ? user.getFullName() : user.getEmail()) : "Bilinmeyen Müşteri";
    }

    @com.fasterxml.jackson.annotation.JsonProperty("customerEmail")
    public String getCustomerEmail() {
        return user != null ? user.getEmail() : null;
    }
}