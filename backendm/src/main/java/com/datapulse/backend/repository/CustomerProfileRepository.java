package com.datapulse.backend.repository;

import com.datapulse.backend.entity.CustomerProfile;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.Optional;

@Repository
public interface CustomerProfileRepository extends JpaRepository<CustomerProfile, Long> {

    // Bir kullanıcının ID'sine göre profilini bulmak için (ETL sırasında çok işimize yarayacak)
    Optional<CustomerProfile> findByUserId(Long userId);
    
    // Eğer email üzerinden gitmek istersen (User üzerinden join yaparak)
    Optional<CustomerProfile> findByUserEmail(String email);
}