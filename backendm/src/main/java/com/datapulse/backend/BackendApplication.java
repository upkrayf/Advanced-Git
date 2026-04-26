package com.datapulse.backend;

import com.datapulse.backend.entity.Category;
import com.datapulse.backend.entity.Product;
import com.datapulse.backend.entity.Store;
import com.datapulse.backend.entity.User;
import com.datapulse.backend.repository.CategoryRepository;
import com.datapulse.backend.repository.ProductRepository;
import com.datapulse.backend.repository.StoreRepository;
import com.datapulse.backend.repository.UserRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Bean;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.client.RestTemplate;

import java.math.BigDecimal;
import java.util.List;

@SpringBootApplication
public class BackendApplication {

    public static void main(String[] args) {
        SpringApplication.run(BackendApplication.class, args);
    }

    @Bean
    public RestTemplate restTemplate() {
        return new RestTemplate();
    }

    @Bean
    public CommandLineRunner seedData(
            UserRepository userRepository,
            PasswordEncoder passwordEncoder,
            CategoryRepository categoryRepository,
            StoreRepository storeRepository,
            ProductRepository productRepository
    ) {
        return args -> {
            if (userRepository.findByEmail("admin@test.com").isEmpty()) {
                User admin = new User("admin@test.com", passwordEncoder.encode("123"), "ADMIN", "Male");
                User corporate = new User("corporate@test.com", passwordEncoder.encode("123"), "CORPORATE", "Female");
                User individual = new User("individual@test.com", passwordEncoder.encode("123"), "INDIVIDUAL", "Male");
                userRepository.saveAll(List.of(admin, corporate, individual));
            }

            Category electronics = categoryRepository.findByName("Electronics")
                    .orElseGet(() -> categoryRepository.save(new Category("Electronics"))); 
            Category fashion = categoryRepository.findByName("Fashion")
                    .orElseGet(() -> categoryRepository.save(new Category("Fashion")));

            Store corporateStore = storeRepository.findByName("Pulse Store")
                    .orElseGet(() -> {
                        Store store = new Store();
                        store.setName("Pulse Store");
                        store.setStatus("Active");
                        userRepository.findByEmail("corporate@test.com").ifPresent(store::setOwner);
                        return storeRepository.save(store);
                    });

            if (productRepository.findBySku("SP100").isEmpty()) {
                Product p1 = new Product();
                p1.setSku("SP100");
                p1.setName("Smartphone Pro");
                p1.setDescription("Yüksek performanslı bir akıllı telefon.");
                p1.setUnitPrice(new BigDecimal("1299.99"));
                p1.setStockQuantity(35);
                p1.setCategory(electronics);
                p1.setStore(corporateStore);
                p1.setIcon("https://via.placeholder.com/150");
                productRepository.save(p1);

                Product p2 = new Product();
                p2.setSku("FA200");
                p2.setName("Fashion Sneaker");
                p2.setDescription("Konforlu ve şık günlük spor ayakkabı.");
                p2.setUnitPrice(new BigDecimal("199.99"));
                p2.setStockQuantity(70);
                p2.setCategory(fashion);
                p2.setStore(corporateStore);
                p2.setIcon("https://via.placeholder.com/150");
                productRepository.save(p2);
            }
        };
    }
}
