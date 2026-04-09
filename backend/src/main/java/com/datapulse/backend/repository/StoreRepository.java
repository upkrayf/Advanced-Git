package com.datapulse.backend.repository;

import com.datapulse.backend.entity.Store;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface StoreRepository extends JpaRepository<Store, Long> {
    // İleride belirli bir ürüne ait yorumları çekmek istersen buraya metod ekleyebiliriz
}