package com.datapulse.backend.service;

import com.datapulse.backend.dto.ShipmentTrackingDTO;
import com.datapulse.backend.entity.Order;
import com.datapulse.backend.entity.Shipment;
import com.datapulse.backend.repository.OrderRepository;
import com.datapulse.backend.repository.ShipmentRepository;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class ShipmentService {
    private final ShipmentRepository shipmentRepository;
    private final OrderRepository orderRepository;

    public ShipmentService(ShipmentRepository shipmentRepository, OrderRepository orderRepository) {
        this.shipmentRepository = shipmentRepository;
        this.orderRepository = orderRepository;
    }

    public List<Shipment> getAll() {
        return shipmentRepository.findAll();
    }

    public Shipment getById(Long id) {
        return shipmentRepository.findById(id).orElseThrow(() -> new RuntimeException("Shipment not found"));
    }

    public List<ShipmentTrackingDTO> getMyShipments(String email) {
        List<Order> orders = orderRepository.findByUserEmailWithShipment(email);
        return orders.stream()
            .map(o -> new ShipmentTrackingDTO(
                o.getId(),
                o.getOrderNumber(),
                o.getShipment().getId(),
                o.getShipment().getModeOfShipment(),
                o.getShipment().getReachingOnTime()
            ))
            .collect(Collectors.toList());
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
