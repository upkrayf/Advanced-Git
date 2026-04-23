package com.datapulse.backend.config;

import com.datapulse.backend.repository.UserRepository;
import com.datapulse.backend.service.EtlService;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class DatabaseSeeder {

    @Bean
    CommandLineRunner initDatabase(EtlService etlService, UserRepository userRepository) {
        return args -> {
            long userCount = userRepository.count();
            if (userCount == 0) {
                System.out.println("Database is empty. Starting ETL process... This may take a while.");
                etlService.runEtl();
                System.out.println("ETL process completed successfully.");
            } else {
                System.out.println("Database already contains data (" + userCount + " users). Skipping ETL to speed up startup.");
            }
        };
    }
}
