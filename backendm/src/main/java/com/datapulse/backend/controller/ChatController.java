package com.datapulse.backend.controller;

import com.datapulse.backend.dto.ChatRequest;
import com.datapulse.backend.service.AiService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/chat")
public class ChatController {
    private final AiService aiService;

    public ChatController(AiService aiService) {
        this.aiService = aiService;
    }

    @PostMapping("/ask")
    public ResponseEntity<String> ask(@RequestBody ChatRequest request) {
        return ResponseEntity.ok(aiService.ask(request.getQuestion(), request.getRole()));
    }
}
