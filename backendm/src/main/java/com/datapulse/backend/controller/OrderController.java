package com.datapulse.backend.controller;

import com.datapulse.backend.entity.Order;
import com.datapulse.backend.service.OrderService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

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

    @GetMapping("/{id}")
    public ResponseEntity<Order> getById(@PathVariable Long id) {
        return ResponseEntity.ok(orderService.getById(id));
    }

    @PostMapping
    @PreAuthorize("hasAuthority('INDIVIDUAL')")
    public ResponseEntity<Order> create(@RequestBody Order order) {
        // Implementation for creating order mock returning the same.
        return ResponseEntity.ok(order);
    }
}