package com.datapulse.backend.service;

import com.datapulse.backend.entity.Shipment;
import com.datapulse.backend.repository.ShipmentRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class ShipmentService {
    private final ShipmentRepository shipmentRepository;

    public ShipmentService(ShipmentRepository shipmentRepository) {
        this.shipmentRepository = shipmentRepository;
    }

    public List<Shipment> getAll() {
        return shipmentRepository.findAll();
    }

    public Shipment getById(Long id) {
        return shipmentRepository.findById(id).orElseThrow(() -> new RuntimeException("Shipment not found"));
    }

    public List<Shipment> getMyShipments(String email) {
        return shipmentRepository.findByUserEmail(email);
    }

    public Shipment createDefaultShipment() {
        Shipment shipment = new Shipment();
        shipment.setModeOfShipment("Road");
        shipment.setServiceLevel("Standard");
        shipment.setWarehouseBlock("A");
        shipment.setProductImportance("medium");
        shipment.setReachingOnTime(0);
        shipment.setCustomerRating(5);
        shipment.setWeightInGms(500);
        return shipmentRepository.save(shipment);
    }
}
