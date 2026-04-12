package com.datapulse.backend.dto;

import java.math.BigDecimal;

public class DashboardSummary {
    private long totalProducts;
    private long totalOrders;
    private long totalStores;
    private long totalCustomers;
    private BigDecimal totalRevenue;

    public DashboardSummary() {
    }

    public long getTotalProducts() {
        return totalProducts;
    }

    public void setTotalProducts(long totalProducts) {
        this.totalProducts = totalProducts;
    }

    public long getTotalOrders() {
        return totalOrders;
    }

    public void setTotalOrders(long totalOrders) {
        this.totalOrders = totalOrders;
    }

    public long getTotalStores() {
        return totalStores;
    }

    public void setTotalStores(long totalStores) {
        this.totalStores = totalStores;
    }

    public long getTotalCustomers() {
        return totalCustomers;
    }

    public void setTotalCustomers(long totalCustomers) {
        this.totalCustomers = totalCustomers;
    }

    public BigDecimal getTotalRevenue() {
        return totalRevenue;
    }

    public void setTotalRevenue(BigDecimal totalRevenue) {
        this.totalRevenue = totalRevenue;
    }
}