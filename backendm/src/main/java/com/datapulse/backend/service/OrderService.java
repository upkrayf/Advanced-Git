package com.datapulse.backend.service;

import com.datapulse.backend.entity.Order;
import com.datapulse.backend.entity.User;
import com.datapulse.backend.repository.OrderRepository;
import com.datapulse.backend.repository.UserRepository;
import org.springframework.stereotype.Service;
import java.util.List;
import java.util.UUID;

@Service
public class OrderService {
    private final OrderRepository orderRepository;
    private final UserRepository userRepository;
    private final com.datapulse.backend.repository.OrderItemRepository orderItemRepository;
    private final com.datapulse.backend.repository.PaymentRepository paymentRepository;
    private final com.datapulse.backend.repository.ProductRepository productRepository;
    private final ShipmentService shipmentService;

    public OrderService(OrderRepository orderRepository, UserRepository userRepository,
                        com.datapulse.backend.repository.OrderItemRepository orderItemRepository,
                        com.datapulse.backend.repository.PaymentRepository paymentRepository,
                        com.datapulse.backend.repository.ProductRepository productRepository,
                        ShipmentService shipmentService) {
        this.orderRepository = orderRepository;
        this.userRepository = userRepository;
        this.orderItemRepository = orderItemRepository;
        this.paymentRepository = paymentRepository;
        this.productRepository = productRepository;
        this.shipmentService = shipmentService;
    }

    public List<Order> getAll(String status) {
        if (status != null && !status.isBlank()) {
            return orderRepository.findByStatus(status);
        }
        return orderRepository.findAll();
    }

    public Order getById(Long id) {
        return orderRepository.findById(id).orElseThrow(() -> new RuntimeException("Order not found"));
    }

    public List<Order> getMyOrders(String email, String status) {
        User user = userRepository.findByEmail(email).orElseThrow(() -> new RuntimeException("User not found"));
        if (status != null && !status.isBlank()) {
            return orderRepository.findByUserAndStatus(user, status);
        }
        return orderRepository.findByUserOrderByOrderDateDesc(user);
    }

    public List<Order> getStoreOrders(String email, String status) {
        if (status != null && !status.isBlank()) {
            return orderRepository.findByStoreOwnerEmailAndStatus(email, status);
        }
        return orderRepository.findByStoreOwnerEmail(email);
    }

    @jakarta.transaction.Transactional
    public Order updateStatus(Long id, String status) {
        Order order = orderRepository.findById(id).orElseThrow(() -> new RuntimeException("Order not found"));
        order.setStatus(status);
        return orderRepository.save(order);
    }

    @jakarta.transaction.Transactional
    public Order checkout(String email, com.datapulse.backend.dto.CheckoutRequest request) {
        User user = userRepository.findByEmail(email).orElseThrow(() -> new RuntimeException("User not found"));

        Order order = new Order();
        order.setUser(user);
        order.setStatus("PLACED");
        order.setOrderDate(java.time.LocalDateTime.now());
        order.setOrderNumber("ORD-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase());

        java.math.BigDecimal totalValue = java.math.BigDecimal.ZERO;
        for (com.datapulse.backend.dto.CheckoutRequest.OrderItemDto itemDto : request.getItems()) {
            totalValue = totalValue.add(itemDto.getPrice().multiply(java.math.BigDecimal.valueOf(itemDto.getQuantity())));
        }
        order.setTotalAmount(totalValue);
        
        java.util.List<com.datapulse.backend.entity.OrderItem> items = new java.util.ArrayList<>();
        for (com.datapulse.backend.dto.CheckoutRequest.OrderItemDto itemDto : request.getItems()) {
            com.datapulse.backend.entity.Product product = productRepository.findById(itemDto.getProductId())
                    .orElseThrow(() -> new RuntimeException("Product not found: " + itemDto.getProductId()));

            if (product.getStockQuantity() != null && product.getStockQuantity() < itemDto.getQuantity()) {
                throw new RuntimeException("Insufficient stock for product: " + product.getName());
            }

            com.datapulse.backend.entity.OrderItem item = new com.datapulse.backend.entity.OrderItem();
            item.setOrder(order);
            item.setProduct(product);
            item.setQuantity(itemDto.getQuantity());
            item.setPrice(itemDto.getPrice());
            items.add(item);

            if (product.getStockQuantity() != null) {
                product.setStockQuantity(product.getStockQuantity() - itemDto.getQuantity());
                productRepository.save(product);
            }
        }
        order.setItems(items);

        com.datapulse.backend.entity.Payment payment = new com.datapulse.backend.entity.Payment();
        payment.setOrder(order);
        payment.setPaymentType(request.getPaymentMethod());
        payment.setAmount(totalValue);
        order.setPayments(new java.util.ArrayList<>(java.util.List.of(payment)));

        // Create and SAVE shipment through ShipmentService
        com.datapulse.backend.entity.Shipment savedShipment = shipmentService.createDefaultShipment();
        order.setShipment(savedShipment);

        // Final save for the order
        Order finalOrder = orderRepository.save(order);
        
        // Final link for items and payments just to be 100% sure in memory
        return finalOrder;
    }
}