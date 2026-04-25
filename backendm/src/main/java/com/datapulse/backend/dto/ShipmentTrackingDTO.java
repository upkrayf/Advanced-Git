package com.datapulse.backend.dto;

public class ShipmentTrackingDTO {
    private Long id;
    private Long orderId;
    private String orderNumber;
    private String trackingNo;
    private String carrier;
    private String status;
    private String modeOfShipment;

    public ShipmentTrackingDTO() {}

    public ShipmentTrackingDTO(Long orderId, String orderNumber, Long shipmentId,
                               String modeOfShipment, Integer reachingOnTime) {
        this.id = shipmentId;
        this.orderId = orderId;
        this.orderNumber = orderNumber;
        this.trackingNo = "TRK-" + String.format("%07d", shipmentId);
        this.carrier = mapCarrier(modeOfShipment);
        this.status = (reachingOnTime != null && reachingOnTime == 1) ? "DELIVERED" : "SHIPPED";
        this.modeOfShipment = modeOfShipment;
    }

    private static String mapCarrier(String mode) {
        if (mode == null) return "Standart Kargo";
        if ("Flight".equals(mode)) return "THY Kargo";
        if ("Ship".equals(mode)) return "Deniz Kargo";
        if ("Road".equals(mode)) return "PTT Kargo";
        return "Standart Kargo";
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public Long getOrderId() { return orderId; }
    public void setOrderId(Long orderId) { this.orderId = orderId; }
    public String getOrderNumber() { return orderNumber; }
    public void setOrderNumber(String orderNumber) { this.orderNumber = orderNumber; }
    public String getTrackingNo() { return trackingNo; }
    public void setTrackingNo(String trackingNo) { this.trackingNo = trackingNo; }
    public String getCarrier() { return carrier; }
    public void setCarrier(String carrier) { this.carrier = carrier; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public String getModeOfShipment() { return modeOfShipment; }
    public void setModeOfShipment(String modeOfShipment) { this.modeOfShipment = modeOfShipment; }
}
