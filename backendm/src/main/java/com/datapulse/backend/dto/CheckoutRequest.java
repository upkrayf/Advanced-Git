package com.datapulse.backend.dto;

import java.math.BigDecimal;
import java.util.List;

public class CheckoutRequest {
    private String paymentMethod; // credit_card, cash, code
    private List<OrderItemDto> items;

    public static class OrderItemDto {
        private Long productId;
        private Integer quantity;
        private BigDecimal price;

        // Getters and Setters
        public Long getProductId() { return productId; }
        public void setProductId(Long productId) { this.productId = productId; }
        public Integer getQuantity() { return quantity; }
        public void setQuantity(Integer quantity) { this.quantity = quantity; }
        public BigDecimal getPrice() { return price; }
        public void setPrice(BigDecimal price) { this.price = price; }
    }

    // Getters and Setters
    public String getPaymentMethod() { return paymentMethod; }
    public void setPaymentMethod(String paymentMethod) { this.paymentMethod = paymentMethod; }
    public List<OrderItemDto> getItems() { return items; }
    public void setItems(List<OrderItemDto> items) { this.items = items; }
}
