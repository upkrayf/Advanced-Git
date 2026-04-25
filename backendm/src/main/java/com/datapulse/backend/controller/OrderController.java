package com.datapulse.backend.controller;

import com.datapulse.backend.entity.Order;
import com.datapulse.backend.service.OrderService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/orders")
public class OrderController {
    private final OrderService orderService;

    public OrderController(OrderService orderService) {
        this.orderService = orderService;
    }

    @GetMapping
    public ResponseEntity<List<Order>> getOrders(Authentication authentication) {
        String email = authentication.getName();
        boolean isAdmin = authentication.getAuthorities().stream().anyMatch(a -> a.getAuthority().equals("ADMIN"));
        boolean isCorporate = authentication.getAuthorities().stream().anyMatch(a -> a.getAuthority().equals("CORPORATE"));

        if (isAdmin) {
            return ResponseEntity.ok(orderService.getAll());
        } else if (isCorporate) {
            return ResponseEntity.ok(orderService.getStoreOrders(email));
        } else {
            return ResponseEntity.ok(orderService.getMyOrders(email));
        }
    }

    @GetMapping("/my")
    public ResponseEntity<List<Order>> getMyOrders(Authentication authentication) {
        return ResponseEntity.ok(orderService.getMyOrders(authentication.getName()));
    }

    @GetMapping("/{id}")
    public ResponseEntity<Order> getById(@PathVariable Long id) {
        return ResponseEntity.ok(orderService.getById(id));
    }

    @PatchMapping("/{id}/status")
    @PreAuthorize("hasAnyAuthority('ADMIN', 'CORPORATE')")
    public ResponseEntity<Order> updateStatus(@PathVariable Long id, @RequestBody Map<String, String> body) {
        return ResponseEntity.ok(orderService.updateStatus(id, body.get("status")));
    }

    @PostMapping("/checkout")
    @PreAuthorize("hasAuthority('INDIVIDUAL')")
    public ResponseEntity<Order> checkout(Authentication authentication, @RequestBody com.datapulse.backend.dto.CheckoutRequest request) {
        String email = authentication.getName();
        return ResponseEntity.ok(orderService.checkout(email, request));
    }
}