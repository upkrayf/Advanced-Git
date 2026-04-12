package com.datapulse.backend.controller;

import com.datapulse.backend.entity.Category;
import com.datapulse.backend.repository.CategoryRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/categories")
@CrossOrigin(origins = "http://localhost:4200")
public class CategoryController {

    private final CategoryRepository categoryRepository;

    public CategoryController(CategoryRepository categoryRepository) {
        this.categoryRepository = categoryRepository;
    }

    @GetMapping
    public List<Category> getAllCategories() {
        return categoryRepository.findAll();
    }

    @GetMapping("/{id}")
    public ResponseEntity<Category> getCategory(@PathVariable Long id) {
        return categoryRepository.findById(id).map(ResponseEntity::ok).orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    @PreAuthorize("hasAuthority('ADMIN') or hasAuthority('CORPORATE')")
    public Category createCategory(@RequestBody Category category) {
        return categoryRepository.save(category);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAuthority('ADMIN') or hasAuthority('CORPORATE')")
    public ResponseEntity<Category> updateCategory(@PathVariable Long id, @RequestBody Category request) {
        return categoryRepository.findById(id).map(existing -> {
            existing.setName(request.getName());
            existing.setParent(request.getParent());
            return ResponseEntity.ok(categoryRepository.save(existing));
        }).orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAuthority('ADMIN') or hasAuthority('CORPORATE')")
    public ResponseEntity<Void> deleteCategory(@PathVariable Long id) {
        if (!categoryRepository.existsById(id)) return ResponseEntity.notFound().build();
        categoryRepository.deleteById(id);
        return ResponseEntity.noContent().build();
    }
}
