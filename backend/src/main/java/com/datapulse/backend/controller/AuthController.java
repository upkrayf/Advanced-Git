package com.datapulse.backend.controller;

import com.datapulse.backend.config.JwtUtil;
import com.datapulse.backend.dto.AuthResponse;
import com.datapulse.backend.dto.LoginRequest;
import com.datapulse.backend.dto.RefreshTokenRequest;
import com.datapulse.backend.dto.RegisterRequest;
import com.datapulse.backend.entity.RefreshToken;
import com.datapulse.backend.entity.User;
import com.datapulse.backend.repository.RefreshTokenRepository;
import com.datapulse.backend.repository.UserRepository;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.Optional;
import java.util.UUID;

@RestController
@RequestMapping("/api/auth")
@CrossOrigin(origins = "http://localhost:4200")
public class AuthController {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;
    private final RefreshTokenRepository refreshTokenRepository;

    public AuthController(UserRepository userRepository,
                          PasswordEncoder passwordEncoder,
                          JwtUtil jwtUtil,
                          RefreshTokenRepository refreshTokenRepository) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtUtil = jwtUtil;
        this.refreshTokenRepository = refreshTokenRepository;
    }

    @PostMapping("/register")
    public ResponseEntity<String> register(@Valid @RequestBody RegisterRequest request) {
        if (userRepository.findByEmail(request.getEmail()).isPresent()) {
            return ResponseEntity.badRequest().body("Hata: Bu e-posta zaten kullanımda!");
        }

        User newUser = new User();
        newUser.setEmail(request.getEmail());
        newUser.setPasswordHash(passwordEncoder.encode(request.getPassword()));
        newUser.setRoleType(request.getRoleType() == null || request.getRoleType().isBlank()
                ? "INDIVIDUAL"
                : request.getRoleType());
        userRepository.save(newUser);
        return ResponseEntity.ok("Kullanıcı başarıyla kaydedildi!");
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginRequest request) {
        Optional<User> userOpt = userRepository.findByEmail(request.getEmail());
        if (userOpt.isPresent() && passwordEncoder.matches(request.getPassword(), userOpt.get().getPasswordHash())) {
            User user = userOpt.get();
            String token = jwtUtil.generateToken(user.getEmail(), user.getRoleType());
            String refreshToken = createRefreshToken(user);
            return ResponseEntity.ok(new AuthResponse(token, refreshToken, user.getRoleType()));
        } else {
            return ResponseEntity.status(401).body("Hata: E-posta veya şifre yanlış!");
        }
    }

    @PostMapping("/refresh")
    public ResponseEntity<?> refreshToken(@Valid @RequestBody RefreshTokenRequest request) {
        String incoming = request.getRefreshToken();
        Optional<RefreshToken> stored = refreshTokenRepository.findByToken(incoming);
        if (stored.isEmpty() || stored.get().getExpiresAt().isBefore(LocalDateTime.now())) {
            return ResponseEntity.status(401).body("Geçersiz veya süresi dolmuş refresh token.");
        }
        User user = stored.get().getUser();
        String token = jwtUtil.generateToken(user.getEmail(), user.getRoleType());
        return ResponseEntity.ok(new AuthResponse(token, incoming, user.getRoleType()));
    }

    private String createRefreshToken(User user) {
        refreshTokenRepository.deleteByUser(user);
        String token = UUID.randomUUID().toString();
        RefreshToken refreshToken = new RefreshToken();
        refreshToken.setToken(token);
        refreshToken.setUser(user);
        refreshToken.setExpiresAt(LocalDateTime.now().plusDays(7));
        refreshTokenRepository.save(refreshToken);
        return token;
    }
}
