package com.datapulse.backend.repository;

import com.datapulse.backend.entity.Order;
import com.datapulse.backend.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional; 

public interface OrderRepository extends JpaRepository<Order, Long> {
    List<Order> findByUser(User user);
    Optional<Order> findByOrderNumber(String orderNumber); // Bir kullanıcının tüm siparişlerini bulur
    boolean existsByOrderNumber(String orderNumber);

    // 2. Satır: Hata anında tüm kayıtları liste olarak çekebilmek için
    List<Order> findAllByOrderNumber(String orderNumber);
    List<Order> findByStatus(String status);

   
}