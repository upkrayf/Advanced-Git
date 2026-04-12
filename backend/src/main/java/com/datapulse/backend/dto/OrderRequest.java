package com.datapulse.backend.dto;

import com.datapulse.backend.entity.Payment;
import com.datapulse.backend.entity.Shipment;

import java.util.List;

public class OrderRequest {
    private String orderNumber;
    private String status;
    private List<OrderItemRequest> items;
    private Shipment shipment;
    private List<Payment> payments;

    public String getOrderNumber() {
        return orderNumber;
    }

    public void setOrderNumber(String orderNumber) {
        this.orderNumber = orderNumber;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public List<OrderItemRequest> getItems() {
        return items;
    }

    public void setItems(List<OrderItemRequest> items) {
        this.items = items;
    }

    public Shipment getShipment() {
        return shipment;
    }

    public void setShipment(Shipment shipment) {
        this.shipment = shipment;
    }

    public List<Payment> getPayments() {
        return payments;
    }

    public void setPayments(List<Payment> payments) {
        this.payments = payments;
    }
}