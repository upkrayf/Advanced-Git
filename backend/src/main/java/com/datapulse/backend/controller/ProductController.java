package com.datapulse.backend.controller;

import com.datapulse.backend.entity.Product;
import com.datapulse.backend.repository.ProductRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/products")
@CrossOrigin(origins = "http://localhost:4200")
public class ProductController {

    @Autowired
    private ProductRepository productRepository;

    @GetMapping
    public List<Product> getAllProducts() {
        return productRepository.findAll();
    }

    @GetMapping("/{id}")
    public ResponseEntity<Product> getProductById(@PathVariable Long id) {
        return productRepository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public Product createProduct(@RequestBody Product product) {
        return productRepository.save(product);
    }

    // Yeni: Ürün Silme (Yönetim ekranı için gerekli)
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteProduct(@PathVariable Long id) {
        if (!productRepository.existsById(id)) return ResponseEntity.notFound().build();
        productRepository.deleteById(id);
        return ResponseEntity.noContent().build();
    }

    // Yeni: Product-Specific Chat (Angular'daki askGemini'nin karşılığı)
    @PostMapping("/{id}/chat")
    public ResponseEntity<Map<String, String>> askAboutProduct(@PathVariable Long id, @RequestBody Map<String, String> request) {
        String message = request.get("message");
        // Şimdilik dummy bir cevap dönelim, ileride LangGraph'e bağlayacağız
        return ResponseEntity.ok(Map.of("reply", "Ürün " + id + " hakkında sorduğunuz: '" + message + "' sorusunu yakında Al analiz edecek!"));
    }
}