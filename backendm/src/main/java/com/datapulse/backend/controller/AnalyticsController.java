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

    @GetMapping("/platform/kpis")
    public ResponseEntity<Map<String, Object>> getPlatformKpis() {
        return ResponseEntity.ok(analyticsService.getPlatformKpis());
    }

    @GetMapping("/revenue")
    public ResponseEntity<BigDecimal> getTotalRevenue() {
        return ResponseEntity.ok(analyticsService.getTotalRevenue());
    }

    @GetMapping("/orders/status")
    public ResponseEntity<Map<String, Long>> getOrderCountByStatus() {
        return ResponseEntity.ok(analyticsService.getOrderCountByStatus());
    }

    @GetMapping("/revenue/trend")
    public ResponseEntity<?> getRevenueTrend() {
        return ResponseEntity.ok(analyticsService.getRevenueTrend());
    }

    @GetMapping("/products/top")
    public ResponseEntity<?> getTopProducts() {
        return ResponseEntity.ok(analyticsService.getTopProducts());
    }

    @GetMapping("/users/demographics")
    public ResponseEntity<?> getUserDemographics() {
        return ResponseEntity.ok(analyticsService.getUserDemographics());
    }

    @GetMapping("/shipments/stats")
    public ResponseEntity<Map<String, Object>> getShipmentStats() {
        return ResponseEntity.ok(analyticsService.getShipmentStats());
    }

    @GetMapping("/my/stats")
    public ResponseEntity<Map<String, Object>> getMyStats(java.security.Principal principal) {
        return ResponseEntity.ok(analyticsService.getMyStats(principal.getName()));
    }

    @GetMapping("/my/spending/category")
    public ResponseEntity<?> getMySpendingByCategory(java.security.Principal principal) {
        return ResponseEntity.ok(analyticsService.getMySpendingByCategory(principal.getName()));
    }

    @GetMapping("/categories/sales")
    public ResponseEntity<?> getSalesByCategory() {
        return ResponseEntity.ok(analyticsService.getSalesByCategory());
    }

    @GetMapping("/users/stats")
    public ResponseEntity<?> getUserStats() {
        return ResponseEntity.ok(analyticsService.getPlatformKpis());
    }

    @GetMapping("/corporate/kpis")
    public ResponseEntity<?> getCorporateKpis(java.security.Principal principal) {
        return ResponseEntity.ok(analyticsService.getCorporateKpis(principal.getName()));
    }

    @GetMapping("/store/revenue")
    public ResponseEntity<?> getStoreRevenue(java.security.Principal principal) {
        return ResponseEntity.ok(analyticsService.getStoreRevenueTrend(principal.getName()));
    }

    @GetMapping("/store/products/top")
    public ResponseEntity<?> getStoreTopProducts(java.security.Principal principal) {
        return ResponseEntity.ok(analyticsService.getStoreTopProducts(principal.getName()));
    }

    @GetMapping("/my/spending/trend")
    public ResponseEntity<?> getMySpendingTrend(java.security.Principal principal) {
        return ResponseEntity.ok(analyticsService.getMySpendingTrend(principal.getName()));
    }
}
