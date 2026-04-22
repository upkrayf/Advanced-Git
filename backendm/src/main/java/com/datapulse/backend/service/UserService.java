package com.datapulse.backend.service;

import com.datapulse.backend.entity.User;
import com.datapulse.backend.repository.UserRepository;
import org.springframework.stereotype.Service;

import java.util.List;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

@Service
public class UserService {
    private final UserRepository userRepository;

    public UserService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    public List<User> getAll() {
        return userRepository.findAll();
    }

    public Page<User> getAll(Pageable pageable) {
        return userRepository.findAll(pageable);
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
}
