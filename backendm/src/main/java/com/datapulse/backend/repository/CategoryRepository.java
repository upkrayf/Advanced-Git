package com.datapulse.backend.repository;

import com.datapulse.backend.entity.Category;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.Optional;

@Repository
public interface CategoryRepository extends JpaRepository<Category, Long> {
    // ETL sırasında kategori ismine göre kontrol yapabilmek için lazım
    Optional<Category> findByName(String name);
}