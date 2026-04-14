package com.datapulse.backend.service;

import com.datapulse.backend.config.JwtUtil;
import com.datapulse.backend.dto.AuthResponse;
import com.datapulse.backend.dto.AuthResponse;
import com.datapulse.backend.dto.LoginRequest;
import com.datapulse.backend.dto.RefreshTokenRequest;
import com.datapulse.backend.dto.RegisterRequest;
import com.datapulse.backend.entity.RefreshToken;
import com.datapulse.backend.entity.User;
import com.datapulse.backend.repository.UserRepository;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.Optional;

@Service
public class AuthService {
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;
    private final RefreshTokenService refreshTokenService;

    public AuthService(UserRepository userRepository, PasswordEncoder passwordEncoder, JwtUtil jwtUtil, RefreshTokenService refreshTokenService) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtUtil = jwtUtil;
        this.refreshTokenService = refreshTokenService;
    }

    public User register(RegisterRequest request) {
        if (userRepository.findByEmail(request.getEmail()).isPresent()) {
            throw new RuntimeException("Email already exists");
        }
        User user = new User();
        user.setEmail(request.getEmail());
        user.setPasswordHash(passwordEncoder.encode(request.getPassword()));
        user.setRoleType(request.getRoleType() != null ? request.getRoleType() : "INDIVIDUAL");
        return userRepository.save(user);
    }

    public AuthResponse login(LoginRequest request) {
        Optional<User> userOpt = userRepository.findByEmail(request.getEmail());
        if (userOpt.isPresent()) {
            User user = userOpt.get();
            if (passwordEncoder.matches(request.getPassword(), user.getPasswordHash())) {
                String token = jwtUtil.generateToken(user.getEmail(), user.getRoleType());
                
                // İsteğe bağlı olarak eski tokenlar temizlenebilir
                refreshTokenService.deleteByUserId(user.getId());
                
                RefreshToken refreshToken = refreshTokenService.createRefreshToken(user.getId());
                return new AuthResponse(token, refreshToken.getToken(), user.getRoleType());
            }
        }
        throw new RuntimeException("Invalid credentials");
    }

    public AuthResponse refreshToken(RefreshTokenRequest request) {
        return refreshTokenService.findByToken(request.getRefreshToken())
                .map(refreshTokenService::verifyExpiration)
                .map(RefreshToken::getUser)
                .map(user -> {
                    String token = jwtUtil.generateToken(user.getEmail(), user.getRoleType());
                    return new AuthResponse(token, request.getRefreshToken(), user.getRoleType());
                })
                .orElseThrow(() -> new RuntimeException("Refresh token is not in database!"));
    }
}
