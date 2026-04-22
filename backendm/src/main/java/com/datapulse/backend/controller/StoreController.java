package com.datapulse.backend.controller;

import com.datapulse.backend.entity.Store;
import com.datapulse.backend.service.StoreService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/stores")
public class StoreController {
    private final StoreService storeService;

    public StoreController(StoreService storeService) {
        this.storeService = storeService;
    }

    @GetMapping
    public ResponseEntity<List<Store>> getAll() {
        return ResponseEntity.ok(storeService.getAll());
    }

    @GetMapping("/my")
    public ResponseEntity<Store> getMyStore(Authentication authentication) {
        try {
            return ResponseEntity.ok(storeService.getMyStore(authentication.getName()));
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }

    @GetMapping("/{id}")
    public ResponseEntity<Store> getById(@PathVariable Long id) {
        return ResponseEntity.ok(storeService.getById(id));
    }

    @PostMapping
    @PreAuthorize("hasAuthority('ADMIN')")
    public ResponseEntity<Store> create(@RequestBody Store store) {
        // Not specifically defined in service, mock it for now
        return ResponseEntity.ok(store);
    }

    @PutMapping("/{id}/status")
    @PreAuthorize("hasAuthority('ADMIN')")
    public ResponseEntity<Store> changeStatus(@PathVariable Long id, @RequestBody Store statusHolder) {
        if ("ACTIVE".equalsIgnoreCase(statusHolder.getStatus())) {
            return ResponseEntity.ok(storeService.open(id));
        } else {
            return ResponseEntity.ok(storeService.close(id));
        }
    }
}
