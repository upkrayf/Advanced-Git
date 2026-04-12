package com.datapulse.backend.controller;

import com.datapulse.backend.entity.Product;
import com.datapulse.backend.repository.ProductRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/products")
@CrossOrigin(origins = "http://localhost:4200")
public class ProductController {

    private final ProductRepository productRepository;

    public ProductController(ProductRepository productRepository) {
        this.productRepository = productRepository;
    }

    @GetMapping
    public List<Product> getAllProducts(@RequestParam(required = false) String category,
                                        @RequestParam(required = false) String search) {
        if (search != null && !search.isBlank()) {
            return productRepository.findByNameContainingIgnoreCase(search);
        }
        if (category != null && !category.isBlank()) {
            return productRepository.findByCategory_Name(category);
        }
        return productRepository.findAll();
    }

    @GetMapping("/{id}")
    public ResponseEntity<Product> getProductById(@PathVariable Long id) {
        return productRepository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    @PreAuthorize("hasAuthority('ADMIN') or hasAuthority('CORPORATE')")
    public ResponseEntity<Product> createProduct(@RequestBody Product product) {
        return ResponseEntity.ok(productRepository.save(product));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAuthority('ADMIN') or hasAuthority('CORPORATE')")
    public ResponseEntity<Product> updateProduct(@PathVariable Long id, @RequestBody Product update) {
        return productRepository.findById(id).map(existing -> {
            existing.setName(update.getName());
            existing.setDescription(update.getDescription());
            existing.setIcon(update.getIcon());
            existing.setStockQuantity(update.getStockQuantity());
            existing.setUnitPrice(update.getUnitPrice());
            existing.setCategory(update.getCategory());
            existing.setStore(update.getStore());
            return ResponseEntity.ok(productRepository.save(existing));
        }).orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAuthority('ADMIN') or hasAuthority('CORPORATE')")
    public ResponseEntity<Void> deleteProduct(@PathVariable Long id) {
        if (!productRepository.existsById(id)) return ResponseEntity.notFound().build();
        productRepository.deleteById(id);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{id}/chat")
    public ResponseEntity<Map<String, String>> askAboutProduct(@PathVariable Long id, @RequestBody Map<String, String> request) {
        String message = request.get("message");
        return ResponseEntity.ok(Map.of("reply", "Ürün " + id + " hakkında sorduğunuz: '" + message + "' sorusunu yakında AI analiz edecek!"));
    }
}