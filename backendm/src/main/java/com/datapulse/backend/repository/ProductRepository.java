package com.datapulse.backend.repository;

import com.datapulse.backend.entity.Product;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface ProductRepository extends JpaRepository<Product, Long> {
    Page<Product> findByCategory_Name(String categoryName, Pageable pageable);
    Page<Product> findByNameContainingIgnoreCaseOrDescriptionContainingIgnoreCase(String name, String description, Pageable pageable);
    Page<Product> findByCategoryId(Long categoryId, Pageable pageable);
    Optional<Product> findBySku(String sku);
    List<Product> findByStoreId(Long storeId);
    List<Product> findByCategoryId(Long categoryId);
}
