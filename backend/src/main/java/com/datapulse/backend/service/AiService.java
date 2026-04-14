package com.datapulse.backend.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import org.springframework.http.ResponseEntity;

import java.util.Map;
import java.util.HashMap;

@Service
public class AiService {
    private final RestTemplate restTemplate;
    
    @Value("${app.ai.service.url}")
    private String aiServiceUrl;

    public AiService(RestTemplate restTemplate) {
        this.restTemplate = restTemplate;
    }

    public String ask(String question, String role) {
        try {
            Map<String, String> requestData = new HashMap<>();
            requestData.put("question", question);
            requestData.put("role", role);
            
            ResponseEntity<String> response = restTemplate.postForEntity(aiServiceUrl, requestData, String.class);
            return response.getBody();
        } catch (Exception e) {
            return "AI servisinden yanıt alınamadı. Hata: " + e.getMessage();
        }
    }
}
