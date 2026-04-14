package com.datapulse.backend.controller;

import com.datapulse.backend.dto.QueryRequest;
import com.datapulse.backend.service.QueryService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/query")
public class QueryController {
    private final QueryService queryService;

    public QueryController(QueryService queryService) {
        this.queryService = queryService;
    }

    @PostMapping("/execute")
    @PreAuthorize("hasAuthority('ADMIN')")
    public ResponseEntity<List<Map<String, Object>>> executeQuery(@RequestBody QueryRequest request) {
        return ResponseEntity.ok(queryService.executeQuery(request.getQuery()));
    }
}
