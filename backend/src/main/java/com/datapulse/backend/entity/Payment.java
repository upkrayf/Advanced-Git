package com.datapulse.backend.entity;

import jakarta.persistence.*;
import java.math.BigDecimal;

@Entity
@Table(name = "payments")
public class Payment {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String paymentType; // credit_card, boleto, etc.
    private BigDecimal paymentValue;
    

    @ManyToOne
    @JoinColumn(name = "order_id")
    private Order order;

    public Payment() {}

    // Getter ve Setter'lar
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getPaymentType() { return paymentType; }
    public void setPaymentType(String paymentType) { this.paymentType = paymentType; }
    public BigDecimal getPaymentValue() { return paymentValue; }
    public void setPaymentValue(BigDecimal paymentValue) { this.paymentValue = paymentValue; }
    
    public Order getOrder() { return order; }
    public void setOrder(Order order) { this.order = order; }
}