package com.datapulse.backend.entity;

import jakarta.persistence.*;

@Entity
@Table(name = "shipments")
public class Shipment {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String warehouseBlock;   // DS3: Warehouse_block (A, B, C, D, F)
    private String modeOfShipment;   // DS3: Mode_of_Shipment (Flight, Ship, Road)
    private Integer reachingOnTime;  // DS3: Reached_on_Time (0 veya 1)
    private String productImportance; // DS3: Product_importance (low, medium, high)

    public Shipment() {}

    // Getter ve Setter'lar
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getWarehouseBlock() { return warehouseBlock; }
    public void setWarehouseBlock(String warehouseBlock) { this.warehouseBlock = warehouseBlock; }
    public String getModeOfShipment() { return modeOfShipment; }
    public void setModeOfShipment(String modeOfShipment) { this.modeOfShipment = modeOfShipment; }
    public Integer getReachingOnTime() { return reachingOnTime; }
    public void setReachingOnTime(Integer reachingOnTime) { this.reachingOnTime = reachingOnTime; }
    public String getProductImportance() { return productImportance; }
    public void setProductImportance(String productImportance) { this.productImportance = productImportance; }
}