package com.datapulse.backend.controller;

import com.datapulse.backend.entity.Payment;
import com.datapulse.backend.entity.User;
import com.datapulse.backend.repository.OrderRepository;
import com.datapulse.backend.repository.PaymentRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/payments")
@CrossOrigin(origins = "http://localhost:4200")
public class PaymentController {

    private final PaymentRepository paymentRepository;
    private final OrderRepository orderRepository;

    public PaymentController(PaymentRepository paymentRepository, OrderRepository orderRepository) {
        this.paymentRepository = paymentRepository;
        this.orderRepository = orderRepository;
    }

    @GetMapping
    @PreAuthorize("hasAuthority('ADMIN') or hasAuthority('CORPORATE')")
    public List<Payment> getAllPayments() {
        return paymentRepository.findAll();
    }

    @GetMapping("/order/{orderId}")
    public ResponseEntity<List<Payment>> getPaymentsByOrder(@PathVariable Long orderId,
                                                            @AuthenticationPrincipal User currentUser) {
        return orderRepository.findById(orderId)
                .map(order -> {
                    if (!isAdmin(currentUser) && (order.getUser() == null || !order.getUser().getId().equals(currentUser.getId()))) {
                        return ResponseEntity.status(403).<List<Payment>>build();
                    }
                    return ResponseEntity.ok(paymentRepository.findByOrder_Id(orderId));
                })
                .orElse(ResponseEntity.notFound().build());
    }

    private boolean isAdmin(User currentUser) {
        return currentUser != null && "ADMIN".equals(currentUser.getRoleType());
    }
}