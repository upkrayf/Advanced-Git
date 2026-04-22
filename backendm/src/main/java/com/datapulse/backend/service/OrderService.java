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

    public OrderService(OrderRepository orderRepository, UserRepository userRepository,
                        com.datapulse.backend.repository.OrderItemRepository orderItemRepository,
                        com.datapulse.backend.repository.PaymentRepository paymentRepository,
                        com.datapulse.backend.repository.ProductRepository productRepository) {
        this.orderRepository = orderRepository;
        this.userRepository = userRepository;
        this.orderItemRepository = orderItemRepository;
        this.paymentRepository = paymentRepository;
        this.productRepository = productRepository;
    }

    public List<Order> getAll() {
        return orderRepository.findAll();
    }

    public Order getById(Long id) {
        return orderRepository.findById(id).orElseThrow(() -> new RuntimeException("Order not found"));
    }

    public List<Order> getMyOrders(String email) {
        User user = userRepository.findByEmail(email).orElseThrow(() -> new RuntimeException("User not found"));
        return orderRepository.findByUserOrderByOrderDateDesc(user);
    }

    public List<Order> getStoreOrders(String email) {
        return orderRepository.findByStoreOwnerEmail(email);
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
        order = orderRepository.save(order);

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
            orderItemRepository.save(item);

            if (product.getStockQuantity() != null) {
                product.setStockQuantity(product.getStockQuantity() - itemDto.getQuantity());
                productRepository.save(product);
            }
        }

        com.datapulse.backend.entity.Payment payment = new com.datapulse.backend.entity.Payment();
        payment.setOrder(order);
        payment.setPaymentType(request.getPaymentMethod());
        payment.setAmount(totalValue);
        paymentRepository.save(payment);

        return order;
    }
}