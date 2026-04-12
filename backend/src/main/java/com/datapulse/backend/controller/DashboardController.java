package com.datapulse.backend.controller;

import com.datapulse.backend.dto.DashboardSummary;
import com.datapulse.backend.entity.Category;
import com.datapulse.backend.entity.Order;
import com.datapulse.backend.entity.Product;
import com.datapulse.backend.repository.CategoryRepository;
import com.datapulse.backend.repository.OrderRepository;
import com.datapulse.backend.repository.ProductRepository;
import com.datapulse.backend.repository.StoreRepository;
import com.datapulse.backend.repository.UserRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;
import java.util.stream.Stream;

@RestController
@RequestMapping("/api/dashboard")
@CrossOrigin(origins = "http://localhost:4200")
public class DashboardController {

    private final OrderRepository orderRepository;
    private final ProductRepository productRepository;
    private final StoreRepository storeRepository;
    private final UserRepository userRepository;
    private final CategoryRepository categoryRepository;

    public DashboardController(OrderRepository orderRepository,
                               ProductRepository productRepository,
                               StoreRepository storeRepository,
                               UserRepository userRepository,
                               CategoryRepository categoryRepository) {
        this.orderRepository = orderRepository;
        this.productRepository = productRepository;
        this.storeRepository = storeRepository;
        this.userRepository = userRepository;
        this.categoryRepository = categoryRepository;
    }

    @GetMapping("/summary")
    @PreAuthorize("hasAuthority('ADMIN') or hasAuthority('CORPORATE')")
    public DashboardSummary getSummary() {
        DashboardSummary summary = new DashboardSummary();
        summary.setTotalProducts(productRepository.count());
        summary.setTotalOrders(orderRepository.count());
        summary.setTotalStores(storeRepository.count());
        summary.setTotalCustomers(userRepository.count());
        BigDecimal revenue = orderRepository.findAll().stream()
                .map(Order::getGrandTotal)
                .filter(value -> value != null)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        summary.setTotalRevenue(revenue);
        return summary;
    }

    @GetMapping("/top-products")
    @PreAuthorize("hasAuthority('ADMIN') or hasAuthority('CORPORATE')")
    public ResponseEntity<List<Map<String, Object>>> getTopProducts() {
        List<Order> orders = orderRepository.findAll();
        Map<String, Long> counts = orders.stream()
                .flatMap(order -> order.getItems() == null ? Stream.empty() : order.getItems().stream())
                .collect(Collectors.groupingBy(item -> item.getProduct().getName(), Collectors.counting()));

        List<Map<String, Object>> result = counts.entrySet().stream()
                .sorted(Map.Entry.<String, Long>comparingByValue().reversed())
                .limit(10)
                .map(entry -> {
                    Map<String, Object> row = new LinkedHashMap<>();
                    row.put("product", entry.getKey());
                    row.put("orderedCount", entry.getValue());
                    return row;
                })
                .collect(Collectors.toList());

        return ResponseEntity.ok(result);
    }

    @GetMapping("/revenue-by-category")
    @PreAuthorize("hasAuthority('ADMIN') or hasAuthority('CORPORATE')")
    public ResponseEntity<Map<String, BigDecimal>> getRevenueByCategory() {
        Map<String, BigDecimal> revenueByCategory = orderRepository.findAll().stream()
                .flatMap(order -> order.getItems() == null ? Stream.empty() : order.getItems().stream())
                .collect(Collectors.groupingBy(item -> {
                    Category category = item.getProduct() != null ? item.getProduct().getCategory() : null;
                    return category != null ? category.getName() : "Unknown";
                }, Collectors.mapping(item -> item.getPrice().multiply(BigDecimal.valueOf(item.getQuantity() != null ? item.getQuantity() : 0)),
                        Collectors.reducing(BigDecimal.ZERO, BigDecimal::add))));
        return ResponseEntity.ok(revenueByCategory);
    }

    @GetMapping("/status-count")
    @PreAuthorize("hasAuthority('ADMIN') or hasAuthority('CORPORATE')")
    public ResponseEntity<Map<String, Long>> getOrderStatusCount() {
        Map<String, Long> statusCount = orderRepository.findAll().stream()
                .collect(Collectors.groupingBy(order -> order.getStatus() == null ? "UNKNOWN" : order.getStatus(), Collectors.counting()));
        return ResponseEntity.ok(statusCount);
    }
}
