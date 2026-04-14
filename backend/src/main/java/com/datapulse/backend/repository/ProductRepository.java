package com.datapulse.backend.repository;

import com.datapulse.backend.entity.Product;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface ProductRepository extends JpaRepository<Product, Long> {
    List<Product> findByCategory_Name(String categoryName);
    List<Product> findByNameContainingIgnoreCase(String term);
    Optional<Product> findBySku(String sku);
    List<Product> findByStoreId(Long storeId);
    List<Product> findByCategoryId(Long categoryId);
}
