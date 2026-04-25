package com.datapulse.backend.service;

import com.datapulse.backend.entity.Order;
import com.datapulse.backend.entity.OrderItem;
import com.datapulse.backend.entity.User;
import com.datapulse.backend.repository.OrderRepository;
import com.datapulse.backend.repository.OrderItemRepository;
import com.datapulse.backend.repository.UserRepository;
import com.datapulse.backend.repository.StoreRepository;
import com.datapulse.backend.repository.ShipmentRepository;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class AnalyticsService {
    private final OrderItemRepository orderItemRepository;
    private final UserRepository userRepository;
    private final OrderRepository orderRepository;
    private final StoreRepository storeRepository;
    private final ShipmentRepository shipmentRepository;

    public AnalyticsService(OrderRepository orderRepository,
                            OrderItemRepository orderItemRepository,
                            UserRepository userRepository,
                            StoreRepository storeRepository,
                            ShipmentRepository shipmentRepository) {
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
        Map<String, Long> counts = new HashMap<>();
        for (Object[] row : results) {
            counts.put(row[0] != null ? row[0].toString() : "UNKNOWN", (Long) row[1]);
        }
        return counts;
    }

    public List<Map<String, Object>> getRevenueTrend() {
        List<Object[]> results = orderRepository.getRevenueTrend();
        return results.stream()
                .map(row -> Map.of("name", row[0].toString(), "value", (Object) row[1]))
                .collect(Collectors.toList());
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
                .collect(Collectors.toList());
    }

    public Map<String, Long> getUserDemographics() {
        return userRepository.findAll().stream()
                .collect(Collectors.groupingBy(
                    u -> u.getGender() != null ? u.getGender() : "Unknown", 
                    Collectors.counting()
                ));
    }

    public Map<String, Object> getPlatformKpis() {
        Map<String, Object> kpis = new HashMap<>();
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
                .collect(Collectors.toList());
    }

    public Map<String, Object> getShipmentStats() {
        long total = shipmentRepository.count();
        return Map.of("total", total);
    }

    // --- USER ANALYTICS (RESORED ORIGINAL LOGIC) ---

    public Map<String, Object> getMyStats(String email) {
        User user = userRepository.findByEmail(email).orElseThrow();
        List<Order> myOrders = orderRepository.findByUser(user);
        
        BigDecimal totalSpent = myOrders.stream()
                .map(Order::getTotalAmount)
                .filter(t -> t != null)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        
        return Map.of(
            "totalSpent", totalSpent,
            "totalOrders", myOrders.size(),
            "activeOrders", myOrders.stream().filter(o -> !"DELIVERED".equals(o.getStatus())).count(),
            "pendingReviews", myOrders.size(),
            "savedAmount", totalSpent.multiply(new BigDecimal("0.05"))
        );
    }

    public List<Map<String, Object>> getMySpendingByCategory(String email) {
        User user = userRepository.findByEmail(email).orElseThrow();
        List<Order> myOrders = orderRepository.findByUser(user);
        
        Map<String, BigDecimal> spending = new HashMap<>();
        for (Order order : myOrders) {
            if (order.getItems() != null) {
                for (OrderItem item : order.getItems()) {
                    String catName = (item.getProduct() != null && item.getProduct().getCategory() != null) 
                                    ? item.getProduct().getCategory().getName() : "Diğer";
                    BigDecimal itemTotal = (item.getPrice() != null) ? item.getPrice().multiply(new BigDecimal(item.getQuantity())) : BigDecimal.ZERO;
                    spending.put(catName, spending.getOrDefault(catName, BigDecimal.ZERO).add(itemTotal));
                }
            }
        }
        
        return spending.entrySet().stream()
                .map(e -> Map.<String, Object>of("categoryName", e.getKey(), "amount", e.getValue()))
                .collect(Collectors.toList());
    }

    public List<Map<String, Object>> getMySpendingTrend(String email) {
        User user = userRepository.findByEmail(email).orElseThrow();
        // Sadece trend sorgusu veritabanından hızlandırılmış olarak kalıyor
        List<Object[]> results = orderRepository.getSpendingTrendByUser(user.getId());
        
        return results.stream()
                .map(row -> Map.of("name", row[0].toString(), "value", (Object) row[1]))
                .collect(Collectors.toList());
    }

    // --- CORPORATE ANALYTICS ---

    public Map<String, Object> getCorporateKpis(String email) {
        BigDecimal revenue = orderRepository.getTotalRevenueByOwner(email);
        if (revenue == null) revenue = BigDecimal.ZERO;
        long ordersToday = orderRepository.countOrdersTodayByOwner(email);
        long totalOrders = orderRepository.countTotalOrdersByOwner(email);
        long totalProducts = orderRepository.countProductsByOwner(email);
        long lowStock = orderRepository.countLowStockProductsByOwner(email);

        double avgOrderValue = 0.0;
        if (totalOrders > 0) {
            avgOrderValue = revenue.divide(BigDecimal.valueOf(totalOrders), 2, java.math.RoundingMode.HALF_UP).doubleValue();
        }

        // Count pending shipments: status is PLACED, PENDING, CONFIRMED or SHIPPED
        List<Order> allOrders = orderRepository.findByStoreOwnerEmail(email);
        long pending = allOrders.stream()
                .filter(o -> List.of("PLACED", "PENDING", "CONFIRMED", "SHIPPED").contains(o.getStatus()))
                .count();

        return Map.of(
            "totalRevenue", revenue,
            "ordersToday", (int) ordersToday,
            "avgOrderValue", avgOrderValue,
            "pendingShipments", (int) pending,
            "lowStockItems", lowStock,
            "totalProducts", totalProducts
        );
    }

    public List<Map<String, Object>> getStoreRevenueTrend(String email) {
        List<Object[]> results = orderRepository.getRevenueTrendByOwner(email);
        return results.stream()
                .map(row -> Map.of("name", row[0].toString(), "value", (Object) row[1]))
                .collect(Collectors.toList());
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
                .collect(Collectors.toList());
    }
}
