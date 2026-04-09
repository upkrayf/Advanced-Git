package com.datapulse.backend.repository;

import com.datapulse.backend.entity.Review;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface ReviewRepository extends JpaRepository<Review, Long> {
    // İleride belirli bir ürüne ait yorumları çekmek istersen buraya metod ekleyebiliriz
}