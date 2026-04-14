package com.datapulse.backend.controller;

import com.datapulse.backend.entity.Store;
import com.datapulse.backend.entity.User;
import com.datapulse.backend.service.StoreService;
import com.datapulse.backend.service.UserService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin")
public class AdminController {
    private final UserService userService;
    private final StoreService storeService;

    public AdminController(UserService userService, StoreService storeService) {
        this.userService = userService;
        this.storeService = storeService;
    }

    @GetMapping("/dashboard")
    public ResponseEntity<Map<String, String>> getDashboard() {
        return ResponseEntity.ok(Map.of("message", "Welcome to Admin Dashboard"));
    }

    @GetMapping("/users")
    public ResponseEntity<List<User>> getUsers() {
        return ResponseEntity.ok(userService.getAll());
    }

    @PostMapping("/stores/{id}/open")
    public ResponseEntity<Store> openStore(@PathVariable Long id) {
        return ResponseEntity.ok(storeService.open(id));
    }

    @PostMapping("/stores/{id}/close")
    public ResponseEntity<Store> closeStore(@PathVariable Long id) {
        return ResponseEntity.ok(storeService.close(id));
    }
}
