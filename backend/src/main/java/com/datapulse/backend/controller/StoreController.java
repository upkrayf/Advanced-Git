package com.datapulse.backend.controller;

import com.datapulse.backend.entity.Store;
import com.datapulse.backend.repository.StoreRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/stores")
@CrossOrigin(origins = "http://localhost:4200")
public class StoreController {

    private final StoreRepository storeRepository;

    public StoreController(StoreRepository storeRepository) {
        this.storeRepository = storeRepository;
    }

    @GetMapping
    public List<Store> getAllStores() {
        return storeRepository.findAll();
    }

    @GetMapping("/{id}")
    public ResponseEntity<Store> getStore(@PathVariable Long id) {
        return storeRepository.findById(id).map(ResponseEntity::ok).orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    @PreAuthorize("hasAuthority('ADMIN') or hasAuthority('CORPORATE')")
    public Store createStore(@RequestBody Store store) {
        return storeRepository.save(store);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAuthority('ADMIN') or hasAuthority('CORPORATE')")
    public ResponseEntity<Store> updateStore(@PathVariable Long id, @RequestBody Store request) {
        return storeRepository.findById(id).map(existing -> {
            existing.setName(request.getName());
            existing.setStatus(request.getStatus());
            existing.setOwner(request.getOwner());
            return ResponseEntity.ok(storeRepository.save(existing));
        }).orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAuthority('ADMIN') or hasAuthority('CORPORATE')")
    public ResponseEntity<Void> deleteStore(@PathVariable Long id) {
        if (!storeRepository.existsById(id)) return ResponseEntity.notFound().build();
        storeRepository.deleteById(id);
        return ResponseEntity.noContent().build();
    }
}
