package com.datapulse.backend.service;

import com.datapulse.backend.entity.User;
import com.datapulse.backend.repository.UserRepository;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;
import java.util.HashMap;
import java.util.stream.Collectors;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import com.datapulse.backend.repository.OrderRepository;

@Service
public class UserService {
    private final UserRepository userRepository;
    private final OrderRepository orderRepository;

    public UserService(UserRepository userRepository, OrderRepository orderRepository) {
        this.userRepository = userRepository;
        this.orderRepository = orderRepository;
    }

    public List<User> getAll() {
        return userRepository.findAll();
    }

    public Page<User> getAll(Pageable pageable) {
        return userRepository.findAll(pageable);
    }

    public Page<User> getAll(String search, String role, Pageable pageable) {
        return userRepository.searchUsers(search, role, pageable);
    }

    public User getById(Long id) {
        return userRepository.findById(id).orElseThrow(() -> new RuntimeException("User not found"));
    }

    public User update(Long id, User userDetails) {
        User user = getById(id);
        user.setEmail(userDetails.getEmail());
        user.setFullName(userDetails.getFullName());
        user.setRoleType(userDetails.getRoleType());
        user.setGender(userDetails.getGender());
        return userRepository.save(user);
    }

    public void delete(Long id) {
        userRepository.deleteById(id);
    }

    public User getByEmail(String email) {
        return userRepository.findByEmail(email).orElseThrow(() -> new RuntimeException("User not found"));
    }

    public User updateByEmail(String email, User userDetails) {
        User user = getByEmail(email);
        if (userDetails.getFullName() != null) user.setFullName(userDetails.getFullName());
        if (userDetails.getGender() != null) user.setGender(userDetails.getGender());
        return userRepository.save(user);
    }

    public User toggleStatus(Long id) {
        User user = getById(id);
        String current = user.getRoleType();
        user.setRoleType(current != null && current.startsWith("SUSPENDED_")
            ? current.substring("SUSPENDED_".length())
            : "SUSPENDED_" + current);
        return userRepository.save(user);
    }

    public User create(User user) {
        return userRepository.save(user);
    }

    public List<Map<String, Object>> getStoreCustomers(String email) {
        List<Object[]> results = orderRepository.getCustomersByStoreOwnerEmail(email);
        return results.stream().map(row -> {
            Map<String, Object> map = new HashMap<>();
            map.put("id", row[0]);
            map.put("fullName", row[1]);
            map.put("email", row[2]);
            map.put("city", row[3]);
            map.put("totalOrders", row[4]);
            map.put("totalSpent", row[5]);
            return map;
        }).collect(Collectors.toList());
    }
}
