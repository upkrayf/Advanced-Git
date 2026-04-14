package com.datapulse.backend.service;

import com.datapulse.backend.entity.Order;
import com.datapulse.backend.repository.OrderRepository;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class AnalyticsService {
    private final OrderRepository orderRepository;

    public AnalyticsService(OrderRepository orderRepository) {
        this.orderRepository = orderRepository;
    }

    public BigDecimal getTotalRevenue() {
        return orderRepository.findAll().stream()
                .map(Order::getGrandTotal)
                .filter(total -> total != null)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
    }

    public Map<String, Long> getOrderCountByStatus() {
        List<Order> orders = orderRepository.findAll();
        Map<String, Long> counts = new HashMap<>();
        for (Order order : orders) {
            String status = order.getStatus() != null ? order.getStatus() : "UNKNOWN";
            counts.put(status, counts.getOrDefault(status, 0L) + 1);
        }
        return counts;
    }

    public Map<String, Object> getTopProducts() {
        return Map.of("info", "To be implemented with OrderItem details");
    }

    public Map<String, Object> getSalesByCategory() {
        return Map.of("info", "To be implemented with OrderItem and Category details");
    }

    public Map<String, Object> getShipmentStats() {
        return Map.of("info", "To be implemented with Shipment details");
    }
}
