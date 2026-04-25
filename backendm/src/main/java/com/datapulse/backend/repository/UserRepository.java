package com.datapulse.backend.repository;

import com.datapulse.backend.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import java.util.Optional;

public interface UserRepository extends JpaRepository<User, Long> {
    
    // Spring Boot'un Sihri: Sadece metodun adını İngilizce kurallarına göre yazıyoruz, 
    // arka planda SQL sorgusunu kendi oluşturuyor!
    // Bu metod, giriş yaparken kullanıcının e-postasını veritabanında aramamızı sağlayacak.
    Optional<User> findByEmail(String email);

    @Query("SELECT u FROM User u WHERE " +
           "(:role IS NULL OR u.roleType = :role) AND " +
           "(:search IS NULL OR LOWER(u.fullName) LIKE LOWER(CONCAT('%', :search, '%')) OR LOWER(u.email) LIKE LOWER(CONCAT('%', :search, '%')))")
    Page<User> searchUsers(@Param("search") String search, @Param("role") String role, Pageable pageable);
    
}