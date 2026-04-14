package com.datapulse.backend.repository;

import com.datapulse.backend.entity.Shipment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ShipmentRepository extends JpaRepository<Shipment, Long> {
    List<Shipment> findByModeOfShipment(String modeOfShipment);
}