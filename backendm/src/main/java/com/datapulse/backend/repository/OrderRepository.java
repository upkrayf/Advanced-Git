package com.datapulse.backend.repository;

import com.datapulse.backend.entity.Order;
import com.datapulse.backend.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

public interface OrderRepository extends JpaRepository<Order, Long> {
    List<Order> findByUser(User user);

    List<Order> findByUserOrderByOrderDateDesc(User user);

    Optional<Order> findByOrderNumber(String orderNumber);

    boolean existsByOrderNumber(String orderNumber);

    List<Order> findAllByOrderNumber(String orderNumber);

    List<Order> findByStatus(String status);

    @Query("SELECT SUM(o.totalAmount) FROM Order o")
    BigDecimal getTotalRevenue();

    @Query("SELECT o.status, COUNT(o) FROM Order o GROUP BY o.status")
    List<Object[]> getOrderCountByStatus();

    @Query("SELECT SUBSTRING(CAST(o.orderDate AS string), 1, 7) as month, SUM(o.totalAmount) FROM Order o GROUP BY month ORDER BY month")
    List<Object[]> getRevenueTrend();

    @Query("SELECT SUM(o.totalAmount) FROM Order o WHERE o.user.email = :email")
    BigDecimal getTotalSpentByUser(@Param("email") String email);

    @Query("SELECT COUNT(o) FROM Order o WHERE o.user.email = :email AND o.status != 'DELIVERED'")
    long countActiveOrdersByUser(@Param("email") String email);

    @Query("SELECT SUM(oi.price * oi.quantity) FROM OrderItem oi WHERE oi.product.store.owner.email = :email")
    BigDecimal getTotalRevenueByOwner(@Param("email") String email);

    @Query("SELECT COUNT(DISTINCT oi.order) FROM OrderItem oi WHERE oi.product.store.owner.email = :email AND CAST(oi.order.orderDate AS date) = CURRENT_DATE")
    long countOrdersTodayByOwner(@Param("email") String email);

    @Query("SELECT COUNT(p) FROM Product p WHERE p.store.owner.email = :email")
    long countProductsByOwner(@Param("email") String email);

    @Query("SELECT COUNT(p) FROM Product p WHERE p.store.owner.email = :email AND p.stockQuantity < 10")
    long countLowStockProductsByOwner(@Param("email") String email);

    @Query("SELECT DISTINCT o FROM Order o JOIN o.items oi WHERE oi.product.store.owner.email = :email")
    List<Order> findByStoreOwnerEmail(@Param("email") String email);

    @Query("SELECT SUBSTRING(CAST(o.orderDate AS string), 1, 7) as month, SUM(o.totalAmount) FROM Order o JOIN o.items oi WHERE oi.product.store.owner.email = :email GROUP BY month ORDER BY month")
    List<Object[]> getRevenueTrendByOwner(@Param("email") String email);
}