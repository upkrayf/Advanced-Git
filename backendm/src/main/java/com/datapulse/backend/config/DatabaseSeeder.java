package com.datapulse.backend.config;

import com.datapulse.backend.service.EtlService;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class DatabaseSeeder {

    @Bean
    CommandLineRunner initDatabase(EtlService etlService) {
        return args -> {
            System.out.println("Checking if ETL needs to run...");
            // Run the ETL
            etlService.runEtl();
        };
    }
}
