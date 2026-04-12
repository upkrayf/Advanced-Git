package com.datapulse.backend.controller;

import com.datapulse.backend.dto.OrderItemRequest;
import com.datapulse.backend.dto.OrderRequest;
import com.datapulse.backend.entity.Order;
import com.datapulse.backend.entity.OrderItem;
import com.datapulse.backend.entity.Product;
import com.datapulse.backend.entity.User;
import com.datapulse.backend.repository.OrderRepository;
import com.datapulse.backend.repository.ProductRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@RestController
@RequestMapping("/api/orders")
@CrossOrigin(origins = "http://localhost:4200")
public class OrderController {

    private final OrderRepository orderRepository;
    private final ProductRepository productRepository;

    public OrderController(OrderRepository orderRepository,
                           ProductRepository productRepository) {
        this.orderRepository = orderRepository;
        this.productRepository = productRepository;
    }

    @GetMapping
    public List<Order> getOrders(@AuthenticationPrincipal User currentUser) {
        if (currentUser == null) {
            return orderRepository.findAll();
        }
        if ("ADMIN".equals(currentUser.getRoleType())) {
            return orderRepository.findAll();
        }
        return orderRepository.findByUser(currentUser);
    }

    @GetMapping("/{id}")
    public ResponseEntity<Order> getOrder(@PathVariable Long id, @AuthenticationPrincipal User currentUser) {
        Optional<Order> orderOpt = orderRepository.findById(id);
        if (orderOpt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }
        Order order = orderOpt.get();
        if (!isAdmin(currentUser) && (order.getUser() == null || !order.getUser().getId().equals(currentUser.getId()))) {
            return ResponseEntity.status(403).build();
        }
        return ResponseEntity.ok(order);
    }

    @PostMapping
    public ResponseEntity<?> createOrder(@AuthenticationPrincipal User currentUser,
                                         @RequestBody OrderRequest request) {
        if (currentUser == null) {
            return ResponseEntity.status(401).body("Kullanıcı kimliği bulunamadı.");
        }
        if (request.getItems() == null || request.getItems().isEmpty()) {
            return ResponseEntity.badRequest().body("Sipariş en az bir ürün içermelidir.");
        }

        Order order = new Order();
        order.setOrderNumber(request.getOrderNumber() == null || request.getOrderNumber().isBlank()
                ? UUID.randomUUID().toString()
                : request.getOrderNumber());
        order.setOrderDate(LocalDateTime.now());
        order.setStatus(request.getStatus() == null || request.getStatus().isBlank() ? "PENDING" : request.getStatus());
        order.setUser(currentUser);
        order.setShipment(request.getShipment());

        List<OrderItem> items = new ArrayList<>();
        BigDecimal total = BigDecimal.ZERO;
        for (OrderItemRequest itemReq : request.getItems()) {
            if (itemReq.getQuantity() == null || itemReq.getQuantity() <= 0) {
                continue;
            }
            Optional<Product> productOpt = Optional.empty();
            if (itemReq.getProductId() != null) {
                productOpt = productRepository.findById(itemReq.getProductId());
            }
            if (productOpt.isEmpty() && itemReq.getSku() != null) {
                productOpt = productRepository.findBySku(itemReq.getSku());
            }
            if (productOpt.isEmpty()) {
                return ResponseEntity.badRequest().body("Ürün bulunamadı: " + itemReq.getProductId() + " / " + itemReq.getSku());
            }
            Product product = productOpt.get();
            OrderItem item = new OrderItem();
            item.setOrder(order);
            item.setProduct(product);
            item.setQuantity(itemReq.getQuantity());
            BigDecimal price = itemReq.getPrice() != null ? itemReq.getPrice() : product.getUnitPrice();
            item.setPrice(price);
            total = total.add(price.multiply(BigDecimal.valueOf(itemReq.getQuantity())));
            items.add(item);
        }
        order.setItems(items);
        order.setGrandTotal(total);

        if (request.getPayments() != null && !request.getPayments().isEmpty()) {
            request.getPayments().forEach(payment -> payment.setOrder(order));
            order.setPayments(request.getPayments());
        }

        orderRepository.save(order);
        return ResponseEntity.ok(order);
    }

    @PutMapping("/{id}/status")
    @PreAuthorize("hasAuthority('ADMIN') or hasAuthority('CORPORATE')")
    public ResponseEntity<Order> updateOrderStatus(@PathVariable Long id,
                                                    @RequestParam String status) {
        return orderRepository.findById(id).map(order -> {
            order.setStatus(status);
            return ResponseEntity.ok(orderRepository.save(order));
        }).orElse(ResponseEntity.notFound().build());
    }

    private boolean isAdmin(User currentUser) {
        return currentUser != null && "ADMIN".equals(currentUser.getRoleType());
    }
}