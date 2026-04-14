package com.datapulse.backend.service;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;

@Service
public class QueryService {
    private final JdbcTemplate jdbcTemplate;

    public QueryService(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    public List<Map<String, Object>> executeQuery(String sql) {
        String upperSql = sql.trim().toUpperCase();
        
        // Strict read-only query check
        if (!upperSql.startsWith("SELECT")) {
            throw new RuntimeException("Only SELECT queries are allowed for safety reasons.");
        }
        
        // Additional defensive checks
        if (upperSql.contains(" DROP ") || upperSql.contains(" DELETE ") || 
            upperSql.contains(" UPDATE ") || upperSql.contains(" INSERT ") || 
            upperSql.contains(" TRUNCATE ") || upperSql.contains(" ALTER ")) {
            throw new RuntimeException("Query contains forbidden modification keywords.");
        }

        return jdbcTemplate.queryForList(sql);
    }
}
