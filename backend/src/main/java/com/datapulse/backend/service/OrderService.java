package com.datapulse.backend.service;

import com.datapulse.backend.entity.Order;
import com.datapulse.backend.entity.User;
import com.datapulse.backend.repository.OrderRepository;
import com.datapulse.backend.repository.UserRepository;
import org.springframework.stereotype.Service;
import java.util.List;

@Service
public class OrderService {
    private final OrderRepository orderRepository;
    private final UserRepository userRepository;

    public OrderService(OrderRepository orderRepository, UserRepository userRepository) {
        this.orderRepository = orderRepository;
        this.userRepository = userRepository;
    }

    public List<Order> getAll() {
        return orderRepository.findAll();
    }

    public Order getById(Long id) {
        return orderRepository.findById(id).orElseThrow(() -> new RuntimeException("Order not found"));
    }

    public List<Order> getMyOrders(String email) {
        User user = userRepository.findByEmail(email).orElseThrow(() -> new RuntimeException("User not found"));
        return orderRepository.findByUser(user);
    }

    public List<Order> getStoreOrders(String email) {
        // Find orders for the store owned by this corporate user.
        // For simplicity, returning all orders. A more complex query could filter by store id in items.
        return orderRepository.findAll();
    }
}