package com.datapulse.backend.controller;

import com.datapulse.backend.service.EtlService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/etl")
@CrossOrigin(origins = "http://localhost:4200")
public class EtlController {

    private final EtlService etlService;

    public EtlController(EtlService etlService) {
        this.etlService = etlService;
    }

    @PostMapping("/load")
    @PreAuthorize("hasAuthority('ADMIN') or hasAuthority('CORPORATE')")
    public ResponseEntity<Map<String, Object>> loadDatasets() {
        return ResponseEntity.ok(etlService.loadAllDatasets());
    }
}
