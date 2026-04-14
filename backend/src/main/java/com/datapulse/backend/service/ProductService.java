package com.datapulse.backend.service;

import com.datapulse.backend.entity.Product;
import com.datapulse.backend.repository.ProductRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class ProductService {
    private final ProductRepository productRepository;

    public ProductService(ProductRepository productRepository) {
        this.productRepository = productRepository;
    }

    public List<Product> getAll() {
        return productRepository.findAll();
    }

    public Product getById(Long id) {
        return productRepository.findById(id).orElseThrow(() -> new RuntimeException("Product not found"));
    }

    public Product create(Product product) {
        return productRepository.save(product);
    }

    public Product update(Long id, Product details) {
        Product p = getById(id);
        p.setName(details.getName());
        p.setDescription(details.getDescription());
        p.setUnitPrice(details.getUnitPrice());
        p.setStockQuantity(details.getStockQuantity());
        p.setCategory(details.getCategory());
        p.setStore(details.getStore());
        return productRepository.save(p);
    }

    public void delete(Long id) {
        productRepository.deleteById(id);
    }

    public List<Product> findByStore(Long storeId) {
        return productRepository.findByStoreId(storeId);
    }

    public List<Product> findByCategory(Long categoryId) {
        return productRepository.findByCategoryId(categoryId);
    }
}
