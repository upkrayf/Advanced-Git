package com.datapulse.backend.repository;

import com.datapulse.backend.entity.Payment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface PaymentRepository extends JpaRepository<Payment, Long> {
    // İleride belirli bir ürüne ait yorumları çekmek istersen buraya metod ekleyebiliriz
}