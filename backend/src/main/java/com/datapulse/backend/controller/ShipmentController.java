package com.datapulse.backend.controller;

import com.datapulse.backend.entity.Shipment;
import com.datapulse.backend.repository.ShipmentRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/shipments")
@CrossOrigin(origins = "http://localhost:4200")
public class ShipmentController {

    private final ShipmentRepository shipmentRepository;

    public ShipmentController(ShipmentRepository shipmentRepository) {
        this.shipmentRepository = shipmentRepository;
    }

    @GetMapping
    public List<Shipment> getAllShipments() {
        return shipmentRepository.findAll();
    }

    @GetMapping("/{id}")
    public ResponseEntity<Shipment> getShipment(@PathVariable Long id) {
        return shipmentRepository.findById(id).map(ResponseEntity::ok).orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    @PreAuthorize("hasAuthority('ADMIN') or hasAuthority('CORPORATE')")
    public Shipment createShipment(@RequestBody Shipment shipment) {
        return shipmentRepository.save(shipment);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAuthority('ADMIN') or hasAuthority('CORPORATE')")
    public ResponseEntity<Shipment> updateShipment(@PathVariable Long id, @RequestBody Shipment request) {
        return shipmentRepository.findById(id).map(existing -> {
            existing.setWarehouseBlock(request.getWarehouseBlock());
            existing.setModeOfShipment(request.getModeOfShipment());
            existing.setReachingOnTime(request.getReachingOnTime());
            existing.setProductImportance(request.getProductImportance());
            return ResponseEntity.ok(shipmentRepository.save(existing));
        }).orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAuthority('ADMIN') or hasAuthority('CORPORATE')")
    public ResponseEntity<Void> deleteShipment(@PathVariable Long id) {
        if (!shipmentRepository.existsById(id)) return ResponseEntity.notFound().build();
        shipmentRepository.deleteById(id);
        return ResponseEntity.noContent().build();
    }
}
