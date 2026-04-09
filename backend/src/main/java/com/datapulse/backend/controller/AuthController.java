package com.datapulse.backend.controller;

import com.datapulse.backend.config.JwtUtil;
import com.datapulse.backend.dto.AuthResponse;
import com.datapulse.backend.dto.LoginRequest;
import com.datapulse.backend.dto.RegisterRequest;
import com.datapulse.backend.entity.User;
import com.datapulse.backend.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.Optional;

@RestController
@RequestMapping("/api/auth")
@CrossOrigin(origins = "http://localhost:4200")
public class AuthController {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private JwtUtil jwtUtil; // Jeton makinemizi içeri aldık!

    @PostMapping("/register")
    public ResponseEntity<String> register(@RequestBody RegisterRequest request) {
        if (userRepository.findByEmail(request.getEmail()).isPresent()) {
            return ResponseEntity.badRequest().body("Hata: Bu e-posta zaten kullanımda!");
        }

        User newUser = new User();
        newUser.setEmail(request.getEmail());
        newUser.setPasswordHash(passwordEncoder.encode(request.getPassword())); 
        
        if (request.getRoleType() == null || request.getRoleType().isEmpty()) {
            newUser.setRoleType("INDIVIDUAL");
        } else {
            newUser.setRoleType(request.getRoleType());
        }

        userRepository.save(newUser);
        return ResponseEntity.ok("Kullanıcı başarıyla kaydedildi!");
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginRequest request) {
        
        Optional<User> userOpt = userRepository.findByEmail(request.getEmail());
        
        if (userOpt.isPresent() && passwordEncoder.matches(request.getPassword(), userOpt.get().getPasswordHash())) {
            
            User user = userOpt.get();
            // Şifre doğruysa, Jeton makinesine token ürettir!
            String token = jwtUtil.generateToken(user.getEmail(), user.getRoleType());
            
            // Angular'a Token'ı ve Rolü Zarfın içinde gönder
            return ResponseEntity.ok(new AuthResponse(token, user.getRoleType()));
            
        } else {
            return ResponseEntity.status(401).body("Hata: E-posta veya şifre yanlış!");
        }
    }
}