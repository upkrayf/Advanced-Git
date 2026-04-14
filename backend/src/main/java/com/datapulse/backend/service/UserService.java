package com.datapulse.backend.service;

import com.datapulse.backend.entity.User;
import com.datapulse.backend.repository.UserRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class UserService {
    private final UserRepository userRepository;

    public UserService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    public List<User> getAll() {
        return userRepository.findAll();
    }

    public User getById(Long id) {
        return userRepository.findById(id).orElseThrow(() -> new RuntimeException("User not found"));
    }

    public User update(Long id, User userDetails) {
        User user = getById(id);
        user.setEmail(userDetails.getEmail());
        user.setRoleType(userDetails.getRoleType());
        user.setGender(userDetails.getGender());
        return userRepository.save(user);
    }

    public void delete(Long id) {
        userRepository.deleteById(id);
    }
}
