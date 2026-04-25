package com.datapulse.backend.controller;

import com.datapulse.backend.entity.Product;
import com.datapulse.backend.service.ProductService;
import com.datapulse.backend.service.StoreService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import java.security.Principal;

@RestController
@RequestMapping("/api/products")
public class ProductController {
    private final ProductService productService;
    private final StoreService storeService;

    public ProductController(ProductService productService, StoreService storeService) {
        this.productService = productService;
        this.storeService = storeService;
    }

    @GetMapping
    public ResponseEntity<?> getAll(
            @RequestParam(required = false) String searchTerm,
            @RequestParam(required = false) Long categoryId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        return ResponseEntity.ok(productService.getAll(searchTerm, categoryId, org.springframework.data.domain.PageRequest.of(page, size)));
    }

    @GetMapping("/{id}")
    public ResponseEntity<Product> getById(@PathVariable Long id) {
        return ResponseEntity.ok(productService.getById(id));
    }

    @PostMapping
    @PreAuthorize("hasAuthority('CORPORATE') or hasAuthority('ADMIN')")
    public ResponseEntity<Product> create(@RequestBody Product product, Principal principal) {
        if (product.getStore() == null && principal != null) {
            try {
                product.setStore(storeService.getMyStore(principal.getName()));
            } catch (Exception e) {
                // Admin might not have a store
            }
        }
        return ResponseEntity.ok(productService.create(product));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAuthority('CORPORATE') or hasAuthority('ADMIN')")
    public ResponseEntity<Product> update(@PathVariable Long id, @RequestBody Product product) {
        return ResponseEntity.ok(productService.update(id, product));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAuthority('CORPORATE') or hasAuthority('ADMIN')")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        productService.delete(id);
        return ResponseEntity.noContent().build();
    }
}