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

    @Query("SELECT SUM(o.totalAmount) FROM Order o WHERE o.user.id = :userId")
    BigDecimal getTotalSpentByUser(@Param("userId") Long userId);

    @Query(value = "SELECT c.name, SUM(oi.price * oi.quantity) " +
           "FROM orders o " +
           "JOIN order_items oi ON o.id = oi.order_id " +
           "JOIN products p ON oi.product_id = p.id " +
           "JOIN categories c ON p.category_id = c.id " +
           "WHERE o.user_id = :userId " +
           "GROUP BY c.name", nativeQuery = true)
    List<Object[]> getSpendingByCategory(@Param("userId") Long userId);

    @Query(value = "SELECT TO_CHAR(o.created_at, 'YYYY-MM-DD') as day, SUM(o.total_amount) " +
           "FROM orders o " +
           "WHERE o.user_id = :userId " +
           "GROUP BY day ORDER BY day DESC LIMIT 30", nativeQuery = true)
    List<Object[]> getSpendingTrendByUser(@Param("userId") Long userId);

    @Query("SELECT COUNT(p) FROM Product p WHERE p.store.owner.email = :email")
    long countProductsByOwner(@Param("email") String email);

    @Query("SELECT COUNT(p) FROM Product p WHERE p.store.owner.email = :email AND p.stockQuantity < 10")
    long countLowStockProductsByOwner(@Param("email") String email);

    @Query("SELECT DISTINCT o FROM Order o JOIN o.items oi WHERE oi.product.store.owner.email = :email")
    List<Order> findByStoreOwnerEmail(@Param("email") String email);

    @Query("SELECT o FROM Order o WHERE o.user.email = :email AND o.shipment IS NOT NULL ORDER BY o.orderDate DESC")
    List<Order> findByUserEmailWithShipment(@Param("email") String email);

    @Query("SELECT SUBSTRING(CAST(o.orderDate AS string), 1, 7) as month, SUM(o.totalAmount) FROM Order o JOIN o.items oi WHERE oi.product.store.owner.email = :email GROUP BY month ORDER BY month")
    List<Object[]> getRevenueTrendByOwner(@Param("email") String email);
}