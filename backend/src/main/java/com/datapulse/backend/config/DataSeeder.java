package com.datapulse.backend.config;

import com.datapulse.backend.entity.Category;
import com.datapulse.backend.entity.Product;
import com.datapulse.backend.entity.Store;
import com.datapulse.backend.entity.User;
import com.datapulse.backend.repository.CategoryRepository;
import com.datapulse.backend.repository.ProductRepository;
import com.datapulse.backend.repository.StoreRepository;
import com.datapulse.backend.repository.UserRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.math.BigDecimal;

@Configuration
public class DataSeeder {

    @Bean
    CommandLineRunner initDatabase(
            UserRepository userRepository,
            PasswordEncoder passwordEncoder,
            CategoryRepository categoryRepository,
            StoreRepository storeRepository,
            ProductRepository productRepository) {

        return args -> {
            if (userRepository.count() == 0) {
                User admin = createUser(userRepository, passwordEncoder, "admin@datapulse.com", "1234", "ADMIN");
                User corp = createUser(userRepository, passwordEncoder, "corp@datapulse.com", "1234", "CORPORATE");
                User user = createUser(userRepository, passwordEncoder, "user@datapulse.com", "1234", "INDIVIDUAL");
                seedSampleData(categoryRepository, storeRepository, productRepository, corp);
                System.out.println("Test kullanıcıları ve örnek veriler oluşturuldu!");
            } else {
                System.out.println("Kullanıcılar zaten mevcut, atlanıyor.");
            }
        };
    }

    private User createUser(UserRepository repo, PasswordEncoder encoder,
            String email, String pass, String role) {
        User u = new User();
        u.setEmail(email);
        u.setPasswordHash(encoder.encode(pass));
        u.setRoleType(role);
        return repo.save(u);
    }

    private void seedSampleData(CategoryRepository categoryRepository,
                                StoreRepository storeRepository,
                                ProductRepository productRepository,
                                User corpUser) {
        Category category = new Category();
        category.setName("Electronics");
        categoryRepository.save(category);

        Store store = new Store();
        store.setName("Datapulse Store");
        store.setStatus("ACTIVE");
        store.setOwner(corpUser);
        storeRepository.save(store);

        Product product = new Product();
        product.setName("Datapulse Smart Band");
        product.setSku("DP-001");
        product.setDescription("Akıllı bileklik, adım sayar ve bildirim özellikleri.");
        product.setCategory(category);
        product.setStore(store);
        product.setUnitPrice(new BigDecimal("129.99"));
        product.setStockQuantity(120);
        productRepository.save(product);
    }
}