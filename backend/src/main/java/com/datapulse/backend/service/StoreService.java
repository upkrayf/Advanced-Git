package com.datapulse.backend.service;

import com.datapulse.backend.entity.Store;
import com.datapulse.backend.entity.User;
import com.datapulse.backend.repository.StoreRepository;
import com.datapulse.backend.repository.UserRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class StoreService {
    private final StoreRepository storeRepository;
    private final UserRepository userRepository;

    public StoreService(StoreRepository storeRepository, UserRepository userRepository) {
        this.storeRepository = storeRepository;
        this.userRepository = userRepository;
    }

    public List<Store> getAll() {
        return storeRepository.findAll();
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
        // Assuming user has a method getStores() that returns List<Store> based on the defined entity relation list.
        if (user.getStores() != null && !user.getStores().isEmpty()) {
            return user.getStores().get(0);
        }
        throw new RuntimeException("Store not found for corporate user");
    }
}
