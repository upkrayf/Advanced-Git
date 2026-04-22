package com.datapulse.backend.repository;

import com.datapulse.backend.entity.OrderItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface OrderItemRepository extends JpaRepository<OrderItem, Long> {
    @Query("SELECT p.name as productName, SUM(oi.quantity) as totalSold, SUM(oi.price * oi.quantity) as revenue " +
           "FROM OrderItem oi JOIN oi.product p " +
           "GROUP BY p.name ORDER BY totalSold DESC")
    List<Object[]> getTopProducts();

    @Query("SELECT c.name as categoryName, SUM(oi.price * oi.quantity) as totalRevenue " +
           "FROM OrderItem oi JOIN oi.product p JOIN p.category c " +
           "GROUP BY c.name")
    List<Object[]> getSalesByCategory();

    @Query("SELECT p.name as productName, SUM(oi.quantity) as totalSold, SUM(oi.price * oi.quantity) as revenue " +
           "FROM OrderItem oi JOIN oi.product p " +
           "WHERE p.store.owner.email = :email " +
           "GROUP BY p.name ORDER BY totalSold DESC")
    List<Object[]> getTopProductsByOwner(@Param("email") String email);
}