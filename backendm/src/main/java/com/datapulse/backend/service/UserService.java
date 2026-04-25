package com.datapulse.backend.service;

import com.datapulse.backend.entity.User;
import com.datapulse.backend.repository.CustomerProfileRepository;
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
    private final CustomerProfileRepository profileRepository;

    public UserService(UserRepository userRepository,
                       OrderRepository orderRepository,
                       CustomerProfileRepository profileRepository) {
        this.userRepository = userRepository;
        this.orderRepository = orderRepository;
        this.profileRepository = profileRepository;
    }

    /** Returns combined User + CustomerProfile data as a flat map. */
    public Map<String, Object> getProfileData(String email) {
        User user = getByEmail(email);
        Map<String, Object> dto = new HashMap<>();
        dto.put("id",       user.getId());
        dto.put("email",    user.getEmail());
        dto.put("fullName", user.getFullName());
        dto.put("gender",   user.getGender());
        dto.put("phone",    user.getPhone());
        dto.put("roleType", user.getRoleType());

        profileRepository.findByUserEmail(email).ifPresent(p -> {
            dto.put("city",             p.getCity());
            dto.put("age",              p.getAge());
            dto.put("membershipType",   p.getMembershipType());
            dto.put("averageRating",    p.getAverageRating());
            dto.put("satisfactionLevel",p.getSatisfactionLevel());
        });
        return dto;
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

    public Map<String, Object> updateByEmail(String email, Map<String, Object> body) {
        User user = getByEmail(email);
        if (body.containsKey("fullName") && body.get("fullName") != null)
            user.setFullName(body.get("fullName").toString());
        if (body.containsKey("gender") && body.get("gender") != null)
            user.setGender(body.get("gender").toString());
        if (body.containsKey("phone"))
            user.setPhone(body.get("phone") != null ? body.get("phone").toString() : null);
        userRepository.save(user);

        if (body.containsKey("city")) {
            String city = body.get("city") != null ? body.get("city").toString() : null;
            profileRepository.findByUserEmail(email).ifPresent(p -> {
                p.setCity(city);
                profileRepository.save(p);
            });
        }
        return getProfileData(email);
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
