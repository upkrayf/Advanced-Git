package com.datapulse.backend.controller;

import com.datapulse.backend.dto.ShipmentTrackingDTO;
import com.datapulse.backend.entity.Shipment;
import com.datapulse.backend.service.ShipmentService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/shipments")
public class ShipmentController {
    private final ShipmentService shipmentService;

    public ShipmentController(ShipmentService shipmentService) {
        this.shipmentService = shipmentService;
    }

    @GetMapping
    public ResponseEntity<?> getAll(Authentication authentication) {
        boolean isCorporate = authentication.getAuthorities().stream().anyMatch(a -> a.getAuthority().equals("CORPORATE"));
        if (isCorporate) {
            return ResponseEntity.ok(shipmentService.getStoreShipmentsEnriched(authentication.getName()));
        }
        return ResponseEntity.ok(shipmentService.getAll());
    }

    @GetMapping("/my")
    public ResponseEntity<List<ShipmentTrackingDTO>> getMyShipments(Authentication authentication) {
        return ResponseEntity.ok(shipmentService.getMyShipments(authentication.getName()));
    }

    @GetMapping("/{id}")
    public ResponseEntity<Shipment> getById(@PathVariable Long id) {
        return ResponseEntity.ok(shipmentService.getById(id));
    }
}
