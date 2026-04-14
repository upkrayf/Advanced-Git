package com.datapulse.backend.controller;

import com.datapulse.backend.dto.AuthResponse;
import com.datapulse.backend.dto.AuthResponse;
import com.datapulse.backend.dto.LoginRequest;
import com.datapulse.backend.dto.RefreshTokenRequest;
import com.datapulse.backend.dto.RegisterRequest;
import com.datapulse.backend.entity.User;
import com.datapulse.backend.service.AuthService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
public class AuthController {
    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    @PostMapping("/register")
    public ResponseEntity<User> register(@RequestBody RegisterRequest request) {
        return ResponseEntity.ok(authService.register(request));
    }

    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@RequestBody LoginRequest request) {
        return ResponseEntity.ok(authService.login(request));
    }

    @PostMapping("/refresh")
    public ResponseEntity<AuthResponse> refreshToken(@RequestBody RefreshTokenRequest request) {
        return ResponseEntity.ok(authService.refreshToken(request));
    }
}
