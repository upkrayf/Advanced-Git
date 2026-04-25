package com.datapulse.backend.service;

import com.datapulse.backend.entity.Store;
import com.datapulse.backend.entity.User;
import com.datapulse.backend.repository.OrderRepository;
import com.datapulse.backend.repository.StoreRepository;
import com.datapulse.backend.repository.UserRepository;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class StoreService {
    private final StoreRepository storeRepository;
    private final UserRepository userRepository;
    private final OrderRepository orderRepository;

    public StoreService(StoreRepository storeRepository, UserRepository userRepository, OrderRepository orderRepository) {
        this.storeRepository = storeRepository;
        this.userRepository = userRepository;
        this.orderRepository = orderRepository;
    }

    public List<Store> getAll() {
        return storeRepository.findAll();
    }

    public List<Map<String, Object>> getAllEnriched() {
        List<Store> stores = storeRepository.findAll();
        return stores.stream().map(s -> {
            Map<String, Object> map = new HashMap<>();
            map.put("id", s.getId());
            map.put("name", s.getName());
            map.put("status", s.getStatus());
            map.put("isActive", s.getIsActive());
            map.put("ownerName", s.getOwnerName());
            map.put("city", s.getCity());
            map.put("productCount", s.getProductCount());
            
            if (s.getOwner() != null) {
                String email = s.getOwner().getEmail();
                BigDecimal revenue = orderRepository.getTotalRevenueByOwner(email);
                long orders = orderRepository.countTotalOrdersByOwner(email);
                map.put("totalRevenue", revenue != null ? revenue : BigDecimal.ZERO);
                map.put("totalOrders", orders);
            } else {
                map.put("totalRevenue", BigDecimal.ZERO);
                map.put("totalOrders", 0L);
            }
            return map;
        }).collect(Collectors.toList());
    }

    public Store getById(Long id) {
        return storeRepository.findById(id).orElseThrow(() -> new RuntimeException("Store not found"));
    }

    public Store open(Long id) {
        Store store = getById(id);
        store.setStatus("ACTIVE");
        return storeRepository.save(store);
    }

    public Store close(Long id) {
        Store store = getById(id);
        store.setStatus("INACTIVE");
        return storeRepository.save(store);
    }

    public Store getMyStore(String email) {
        User user = userRepository.findByEmail(email).orElseThrow(() -> new RuntimeException("User not found"));
        if (user.getStores() != null && !user.getStores().isEmpty()) {
            return user.getStores().get(0);
        }
        throw new RuntimeException("Store not found for corporate user");
    }
}
