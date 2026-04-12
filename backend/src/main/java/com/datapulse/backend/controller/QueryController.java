package com.datapulse.backend.controller;

import com.datapulse.backend.dto.QueryRequest;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/query")
@CrossOrigin(origins = "http://localhost:4200")
public class QueryController {

    private final JdbcTemplate jdbcTemplate;

    public QueryController(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    @PostMapping
    public List<Map<String, Object>> executeQuery(@RequestBody QueryRequest request) {
        String sql = request.getSql();
        if (sql == null || sql.isBlank()) {
            throw new IllegalArgumentException("SQL sorgusu boş olamaz.");
        }
        String normalized = sql.trim().replaceAll("\n", " ").toLowerCase();
        if (!normalized.startsWith("select")) {
            throw new IllegalArgumentException("Sadece SELECT sorgularına izin verilir.");
        }
        if (normalized.contains(";") || normalized.contains("delete") || normalized.contains("update") || normalized.contains("insert") || normalized.contains("drop") || normalized.contains("alter")) {
            throw new IllegalArgumentException("Sadece güvenli SELECT sorguları desteklenir.");
        }
        return jdbcTemplate.queryForList(sql);
    }
}
