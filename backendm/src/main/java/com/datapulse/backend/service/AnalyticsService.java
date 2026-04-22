package com.datapulse.backend.service;

import com.datapulse.backend.entity.Order;
import com.datapulse.backend.repository.OrderRepository;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class AnalyticsService {
    private final com.datapulse.backend.repository.OrderItemRepository orderItemRepository;
    private final com.datapulse.backend.repository.UserRepository userRepository;
    private final OrderRepository orderRepository;
    private final com.datapulse.backend.repository.StoreRepository storeRepository;
    private final com.datapulse.backend.repository.ShipmentRepository shipmentRepository;

    public AnalyticsService(OrderRepository orderRepository,
                            com.datapulse.backend.repository.OrderItemRepository orderItemRepository,
                            com.datapulse.backend.repository.UserRepository userRepository,
                            com.datapulse.backend.repository.StoreRepository storeRepository,
                            com.datapulse.backend.repository.ShipmentRepository shipmentRepository) {
        this.orderRepository = orderRepository;
        this.orderItemRepository = orderItemRepository;
        this.userRepository = userRepository;
        this.storeRepository = storeRepository;
        this.shipmentRepository = shipmentRepository;
    }

    public BigDecimal getTotalRevenue() {
        BigDecimal total = orderRepository.getTotalRevenue();
        return total != null ? total : BigDecimal.ZERO;
    }

    public Map<String, Long> getOrderCountByStatus() {
        List<Object[]> results = orderRepository.getOrderCountByStatus();
        Map<String, Long> counts = new java.util.HashMap<>();
        for (Object[] row : results) {
            counts.put(row[0] != null ? row[0].toString() : "UNKNOWN", (Long) row[1]);
        }
        return counts;
    }

    public List<Map<String, Object>> getRevenueTrend() {
        List<Object[]> results = orderRepository.getRevenueTrend();
        return results.stream()
                .map(row -> Map.of("name", row[0].toString(), "value", (Object) row[1]))
                .collect(java.util.stream.Collectors.toList());
    }

    public List<Map<String, Object>> getTopProducts() {
        List<Object[]> results = orderItemRepository.getTopProducts();
        return results.stream()
                .limit(5)
                .map(row -> Map.<String, Object>of(
                    "productName", row[0].toString(), 
                    "totalSold", row[1],
                    "revenue", row[2]
                ))
                .collect(java.util.stream.Collectors.toList());
    }

    public Map<String, Long> getUserDemographics() {
        // This is still fine for now as user count is typically manageable, 
        // but could also be moved to repo if needed.
        return userRepository.findAll().stream()
                .collect(java.util.stream.Collectors.groupingBy(
                    u -> u.getGender() != null ? u.getGender() : "Unknown", 
                    java.util.stream.Collectors.counting()
                ));
    }

    public Map<String, Object> getPlatformKpis() {
        Map<String, Object> kpis = new java.util.HashMap<>();
        kpis.put("totalUsers", (int)userRepository.count());
        kpis.put("totalOrders", (int)orderRepository.count());
        kpis.put("totalRevenue", getTotalRevenue());
        kpis.put("totalStores", (int)storeRepository.count());
        kpis.put("activeStores", (int)storeRepository.count());
        kpis.put("newUsersThisMonth", 0); 
        kpis.put("newOrdersToday", 0);
        kpis.put("suspendedAccounts", 0);
        return kpis;
    }

    public List<Map<String, Object>> getSalesByCategory() {
        List<Object[]> results = orderItemRepository.getSalesByCategory();
        BigDecimal totalSales = getTotalRevenue();
        
        return results.stream()
                .map(row -> {
                    String name = row[0].toString();
                    BigDecimal revenue = (BigDecimal) row[1];
                    double percentage = totalSales.compareTo(BigDecimal.ZERO) > 0 
                                      ? revenue.multiply(new BigDecimal(100)).divide(totalSales, 2, java.math.RoundingMode.HALF_UP).doubleValue() 
                                      : 0.0;
                    return Map.<String, Object>of(
                        "categoryName", name,
                        "totalRevenue", revenue,
                        "percentage", percentage
                    );
                })
                .collect(java.util.stream.Collectors.toList());
    }

    public Map<String, Object> getShipmentStats() {
        // Optimized to only count at DB level if necessary, but keep it simple for now
        long total = shipmentRepository.count();
        return Map.of("total", total);
    }

    public Map<String, Object> getMyStats(String email) {
        com.datapulse.backend.entity.User user = userRepository.findByEmail(email).orElseThrow();
        List<Order> myOrders = orderRepository.findByUser(user);
        
        BigDecimal totalSpent = myOrders.stream()
                .map(Order::getTotalAmount)
                .filter(t -> t != null)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        
        long pendingReviews = myOrders.size(); 
        
        return Map.of(
            "totalSpent", totalSpent,
            "totalOrders", myOrders.size(),
            "activeOrders", myOrders.stream().filter(o -> !"DELIVERED".equals(o.getStatus())).count(),
            "pendingReviews", pendingReviews,
            "savedAmount", totalSpent.multiply(new BigDecimal("0.05"))
        );
    }

    public List<Map<String, Object>> getMySpendingByCategory(String email) {
        com.datapulse.backend.entity.User user = userRepository.findByEmail(email).orElseThrow();
        List<Order> myOrders = orderRepository.findByUser(user);
        
        Map<String, BigDecimal> spending = new HashMap<>();
        for (Order order : myOrders) {
            if (order.getItems() != null) {
                for (com.datapulse.backend.entity.OrderItem item : order.getItems()) {
                    String catName = (item.getProduct() != null && item.getProduct().getCategory() != null) 
                                    ? item.getProduct().getCategory().getName() : "Diğer";
                    BigDecimal itemTotal = item.getPrice().multiply(new BigDecimal(item.getQuantity()));
                    spending.put(catName, spending.getOrDefault(catName, BigDecimal.ZERO).add(itemTotal));
                }
            }
        }
        
        return spending.entrySet().stream()
                .map(e -> Map.<String, Object>of("categoryName", e.getKey(), "amount", e.getValue()))
                .collect(java.util.stream.Collectors.toList());
    }

    public Map<String, Object> getCorporateKpis(String email) {
        BigDecimal revenue = orderRepository.getTotalRevenueByOwner(email);
        if (revenue == null) revenue = BigDecimal.ZERO;
        long ordersToday = orderRepository.countOrdersTodayByOwner(email);
        long totalProducts = orderRepository.countProductsByOwner(email);
        long lowStock = orderRepository.countLowStockProductsByOwner(email);

        double avgOrderValue = 0.0;
        if (ordersToday > 0) {
            avgOrderValue = revenue.divide(java.math.BigDecimal.valueOf(ordersToday), 2, java.math.RoundingMode.HALF_UP).doubleValue();
        }

        return Map.of(
            "totalRevenue", revenue,
            "ordersToday", (int) ordersToday,
            "avgOrderValue", avgOrderValue,
            "pendingShipments", 0,
            "lowStockItems", lowStock,
            "totalProducts", totalProducts
        );
    }

    public List<Map<String, Object>> getStoreRevenueTrend(String email) {
        List<Object[]> results = orderRepository.getRevenueTrendByOwner(email);
        return results.stream()
                .map(row -> Map.of("name", row[0].toString(), "value", (Object) row[1]))
                .collect(java.util.stream.Collectors.toList());
    }

    public List<Map<String, Object>> getStoreTopProducts(String email) {
        List<Object[]> results = orderItemRepository.getTopProductsByOwner(email);
        return results.stream()
                .limit(10)
                .map(row -> Map.<String, Object>of(
                    "productName", row[0].toString(),
                    "totalSold", row[1],
                    "revenue", row[2]
                ))
                .collect(java.util.stream.Collectors.toList());
    }
}
