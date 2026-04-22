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
}
