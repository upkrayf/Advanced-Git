package com.datapulse.backend.repository;

import com.datapulse.backend.entity.OrderItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface OrderItemRepository extends JpaRepository<OrderItem, Long> {
    // İleride belirli bir ürüne ait yorumları çekmek istersen buraya metod ekleyebiliriz
}