package com.datapulse.backend.config;

import com.datapulse.backend.entity.Category;
import com.datapulse.backend.entity.Product;
import com.datapulse.backend.entity.User;
import com.datapulse.backend.repository.CategoryRepository;
import com.datapulse.backend.repository.ProductRepository;
import com.datapulse.backend.repository.UserRepository;
import com.datapulse.backend.service.EtlService; // 1. SERVİSİ İMPORT ETTİK
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.math.BigDecimal;

@Configuration
public class DataSeeder {

    @Bean
    CommandLineRunner initDatabase(
            ProductRepository productRepository, 
            UserRepository userRepository,
            CategoryRepository categoryRepository,
            PasswordEncoder passwordEncoder,
            EtlService etlService) { // 2. PARAMETRE OLARAK EKLEDİK
        
        return args -> {
            
            // 1. ADIM: TEST KULLANICILARI
            if (userRepository.count() == 0) {
                createUser(userRepository, passwordEncoder, "admin@datapulse.com", "1234", "ADMIN");
                createUser(userRepository, passwordEncoder, "corp@datapulse.com", "1234", "CORPORATE");
                createUser(userRepository, passwordEncoder, "user@datapulse.com", "1234", "INDIVIDUAL");
                System.out.println("✅ Test kullanıcıları oluşturuldu!");
            }

            /*// 2. ADIM: MANUEL KATEGORİLER
            Category clothing = categoryRepository.findByName("Clothing")
                    .orElseGet(() -> categoryRepository.save(new Category("Clothing")));
            
            Category electronics = categoryRepository.findByName("Electronics")
                    .orElseGet(() -> categoryRepository.save(new Category("Electronics")));
*/
/* /* 
            // 3. ADIM: MANUEL ÖRNEK ÜRÜNLER (Frontend testi için)
            if (productRepository.count() == 0) {
                saveProduct(productRepository, "Classic Cotton T-Shirt", "29.99", 124, clothing, "👕");
                saveProduct(productRepository, "Running Sneakers Pro", "89.99", 56, clothing, "👟");
                saveProduct(productRepository, "Smart Watch Series X", "299.99", 18, electronics, "⌚");
                saveProduct(productRepository, "Wireless Headphones", "149.99", 42, electronics, "🎧");
                System.out.println("✅ Manuel başlangıç ürünleri eklendi!");
            }
*/
           
            
            System.out.println("🔄 Kaggle veri setleri işleniyor...");
            etlService.runEtlProcess(); 

        };
    }

 /*   private void saveProduct(ProductRepository repo, String name, String price, int stock, Category cat, String icon) {
        Product p = new Product();
        p.setName(name);
        p.setUnitPrice(new BigDecimal(price));
        
        repo.save(p);
    }*/

    private void createUser(UserRepository repo, PasswordEncoder encoder, String email, String pass, String role) {
        User u = new User();
        u.setEmail(email);
        u.setPasswordHash(encoder.encode(pass));
        u.setRoleType(role);
        repo.save(u);
    }
}