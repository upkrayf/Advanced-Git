package com.datapulse.backend.controller;

import com.datapulse.backend.entity.Category;
import com.datapulse.backend.service.CategoryService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/categories")
public class CategoryController {

    private final CategoryService categoryService;

    public CategoryController(CategoryService categoryService) {
        this.categoryService = categoryService;
    }

    @GetMapping
    public ResponseEntity<List<Category>> getAll() {
        return ResponseEntity.ok(categoryService.getAll());
    }

    @GetMapping("/{id}")
    public ResponseEntity<Category> getById(@PathVariable Long id) {
        return ResponseEntity.ok(categoryService.getById(id));
    }

    @PostMapping
    @PreAuthorize("hasAuthority('ADMIN')")
    public ResponseEntity<Category> create(@RequestBody Map<String, Object> body) {
        Category category = new Category((String) body.get("name"));
        category.setDescription((String) body.get("description"));
        if (body.get("parentId") != null) {
            Category parent = new Category();
            parent.setId(((Number) body.get("parentId")).longValue());
            category.setParent(parent);
        }
        return ResponseEntity.ok(categoryService.create(category));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAuthority('ADMIN')")
    public ResponseEntity<Category> update(@PathVariable Long id, @RequestBody Map<String, Object> body) {
        Category details = new Category((String) body.get("name"));
        details.setDescription((String) body.get("description"));
        if (body.get("parentId") != null) {
            Category parent = new Category();
            parent.setId(((Number) body.get("parentId")).longValue());
            details.setParent(parent);
        }
        return ResponseEntity.ok(categoryService.update(id, details));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAuthority('ADMIN')")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        categoryService.delete(id);
        return ResponseEntity.noContent().build();
    }
}
