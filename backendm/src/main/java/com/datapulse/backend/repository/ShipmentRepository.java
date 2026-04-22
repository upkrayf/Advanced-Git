package com.datapulse.backend.repository;

import com.datapulse.backend.entity.Shipment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ShipmentRepository extends JpaRepository<Shipment, Long> {
    List<Shipment> findByModeOfShipment(String modeOfShipment);

    @Query("SELECT s FROM Shipment s WHERE s.id IN (SELECT o.shipment.id FROM Order o WHERE o.user.email = :email AND o.shipment IS NOT NULL)")
    List<Shipment> findByUserEmail(@Param("email") String email);
}