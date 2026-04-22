package com.datapulse.backend.service;

import com.datapulse.backend.dto.ChatResponse;
import com.datapulse.backend.entity.User;
import com.datapulse.backend.repository.UserRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.HashMap;
import java.util.Map;
import java.util.Optional;

@Service
public class AiService {
    private final RestTemplate restTemplate;
    private final UserRepository userRepository;
    
    @Value("${app.ai.service.url}")
    private String aiServiceUrl;

    public AiService(RestTemplate restTemplate, UserRepository userRepository) {
        this.restTemplate = restTemplate;
        this.userRepository = userRepository;
    }

    public ChatResponse ask(String question, String role) {
        try {
            Map<String, Object> requestData = new HashMap<>();
            requestData.put("question", question);
            requestData.put("role_type", role);

            // Gelişmiş RBAC için Kullanıcı ID'sini bulalım
            Authentication auth = SecurityContextHolder.getContext().getAuthentication();
            if (auth != null && auth.getPrincipal() instanceof String) {
                String email = (String) auth.getPrincipal();
                Optional<User> userOpt = userRepository.findByEmail(email);
                userOpt.ifPresent(user -> requestData.put("user_id", user.getId()));
            }
            
            ResponseEntity<ChatResponse> response = restTemplate.postForEntity(aiServiceUrl, requestData, ChatResponse.class);
            return response.getBody();
        } catch (Exception e) {
            ChatResponse errorResponse = new ChatResponse();
            errorResponse.setReply("AI servisinden yanıt alınamadı. Hata: " + e.getMessage());
            return errorResponse;
        }
    }
}
