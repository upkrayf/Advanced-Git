package com.datapulse.backend.entity;

import jakarta.persistence.*;

@Entity
@Table(name = "shipments")
public class Shipment {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String warehouseBlock;    // DS3: Warehouse_block (A, B, C, D, F)
    private String modeOfShipment;    // DS3: Mode_of_Shipment (Flight, Ship, Road)
    
    @Column(name = "service_level")
    private String serviceLevel;      // DS4: Service Level (Expedited, Standard)
    
    private Integer reachingOnTime;   // DS3: Reached_on_Time (0 veya 1)
    private String productImportance; // DS3: Product_importance (low, medium, high)

    @Column(name = "customer_rating")
    private Integer customerRating;   // DS3: Customer_rating (1-5)

    @Column(name = "discount_offered")
    private Integer discountOffered;  // DS3: Discount_offered

    @Column(name = "weight_in_gms")
    private Integer weightInGms;      // DS3: Weight_in_gms

    public Shipment() {}

    // Getter ve Setter'lar
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getWarehouseBlock() { return warehouseBlock; }
    public void setWarehouseBlock(String warehouseBlock) { this.warehouseBlock = warehouseBlock; }
    public String getModeOfShipment() { return modeOfShipment; }
    public void setModeOfShipment(String modeOfShipment) { this.modeOfShipment = modeOfShipment; }
    public String getServiceLevel() { return serviceLevel; }
    public void setServiceLevel(String serviceLevel) { this.serviceLevel = serviceLevel; }
    public Integer getReachingOnTime() { return reachingOnTime; }
    public void setReachingOnTime(Integer reachingOnTime) { this.reachingOnTime = reachingOnTime; }
    public String getProductImportance() { return productImportance; }
    public void setProductImportance(String productImportance) { this.productImportance = productImportance; }
    public Integer getCustomerRating() { return customerRating; }
    public void setCustomerRating(Integer customerRating) { this.customerRating = customerRating; }
    public Integer getDiscountOffered() { return discountOffered; }
    public void setDiscountOffered(Integer discountOffered) { this.discountOffered = discountOffered; }
    public Integer getWeightInGms() { return weightInGms; }
    public void setWeightInGms(Integer weightInGms) { this.weightInGms = weightInGms; }
}