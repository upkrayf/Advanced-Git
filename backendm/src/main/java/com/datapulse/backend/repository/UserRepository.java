package com.datapulse.backend.repository;

import com.datapulse.backend.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface UserRepository extends JpaRepository<User, Long> {
    
    // Spring Boot'un Sihri: Sadece metodun adını İngilizce kurallarına göre yazıyoruz, 
    // arka planda SQL sorgusunu kendi oluşturuyor!
    // Bu metod, giriş yaparken kullanıcının e-postasını veritabanında aramamızı sağlayacak.
    Optional<User> findByEmail(String email);
    
}