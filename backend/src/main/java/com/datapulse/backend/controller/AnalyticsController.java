package com.datapulse.backend.controller;

import com.datapulse.backend.service.AnalyticsService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.Map;

@RestController
@RequestMapping("/api/analytics")
public class AnalyticsController {
    private final AnalyticsService analyticsService;

    public AnalyticsController(AnalyticsService analyticsService) {
        this.analyticsService = analyticsService;
    }

    @GetMapping("/revenue")
    public ResponseEntity<BigDecimal> getTotalRevenue() {
        return ResponseEntity.ok(analyticsService.getTotalRevenue());
    }

    @GetMapping("/orders/status")
    public ResponseEntity<Map<String, Long>> getOrderCountByStatus() {
        return ResponseEntity.ok(analyticsService.getOrderCountByStatus());
    }

    @GetMapping("/products/top")
    public ResponseEntity<Map<String, Object>> getTopProducts() {
        return ResponseEntity.ok(analyticsService.getTopProducts());
    }

    @GetMapping("/categories/sales")
    public ResponseEntity<Map<String, Object>> getSalesByCategory() {
        return ResponseEntity.ok(analyticsService.getSalesByCategory());
    }

    @GetMapping("/shipments/stats")
    public ResponseEntity<Map<String, Object>> getShipmentStats() {
        return ResponseEntity.ok(analyticsService.getShipmentStats());
    }
}
