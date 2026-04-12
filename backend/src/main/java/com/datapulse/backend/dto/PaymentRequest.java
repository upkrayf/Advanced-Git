package com.datapulse.backend.dto;

import java.math.BigDecimal;

public class PaymentRequest {
    private String paymentType;
    private BigDecimal paymentValue;

    public String getPaymentType() {
        return paymentType;
    }

    public void setPaymentType(String paymentType) {
        this.paymentType = paymentType;
    }

    public BigDecimal getPaymentValue() {
        return paymentValue;
    }

    public void setPaymentValue(BigDecimal paymentValue) {
        this.paymentValue = paymentValue;
    }
}