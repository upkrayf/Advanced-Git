package com.datapulse.backend.exception;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ControllerAdvice;
import org.springframework.web.bind.annotation.ExceptionHandler;

import java.util.HashMap;
import java.util.Map;
import java.util.stream.Collectors;

@ControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(ResourceNotFoundException.class)
    public ResponseEntity<Map<String, String>> handleResourceNotFoundException(ResourceNotFoundException ex) {
        Map<String, String> response = new HashMap<>();
        response.put("error", "Not Found");
        response.put("message", ex.getMessage());
        return new ResponseEntity<>(response, HttpStatus.NOT_FOUND);
    }

    @ExceptionHandler(UnauthorizedException.class)
    public ResponseEntity<Map<String, String>> handleUnauthorizedException(UnauthorizedException ex) {
        Map<String, String> response = new HashMap<>();
        response.put("error", "Unauthorized");
        response.put("message", ex.getMessage());
        return new ResponseEntity<>(response, HttpStatus.UNAUTHORIZED);
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<Map<String, String>> handleValidationException(MethodArgumentNotValidException ex) {
        String errors = ex.getBindingResult().getFieldErrors().stream()
                .map(e -> e.getField() + ": " + e.getDefaultMessage())
                .collect(Collectors.joining(", "));
        Map<String, String> response = new HashMap<>();
        response.put("error", "Validation Failed");
        response.put("message", errors);
        return new ResponseEntity<>(response, HttpStatus.BAD_REQUEST);
    }

    @ExceptionHandler(RuntimeException.class)
    public ResponseEntity<Map<String, String>> handleRuntimeException(RuntimeException ex) {
        Map<String, String> response = new HashMap<>();
        String msg = ex.getMessage() != null ? ex.getMessage() : "";
        if (msg.contains("Invalid credentials") || msg.contains("Refresh token")) {
            response.put("error", "Unauthorized");
            response.put("message", msg);
            return new ResponseEntity<>(response, HttpStatus.UNAUTHORIZED);
        }
        if (msg.contains("already exists")) {
            response.put("error", "Conflict");
            response.put("message", msg);
            return new ResponseEntity<>(response, HttpStatus.CONFLICT);
        }
        if (msg.contains("not found") || msg.contains("Not Found")) {
            response.put("error", "Not Found");
            response.put("message", msg);
            return new ResponseEntity<>(response, HttpStatus.NOT_FOUND);
        }
        if (msg.contains("stock") || msg.contains("Insufficient")) {
            response.put("error", "Bad Request");
            response.put("message", msg);
            return new ResponseEntity<>(response, HttpStatus.BAD_REQUEST);
        }
        response.put("error", "Internal Server Error");
        response.put("message", msg);
        return new ResponseEntity<>(response, HttpStatus.INTERNAL_SERVER_ERROR);
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<Map<String, String>> handleGlobalException(Exception ex) {
        Map<String, String> response = new HashMap<>();
        response.put("error", "Internal Server Error");
        response.put("message", ex.getMessage());
        return new ResponseEntity<>(response, HttpStatus.INTERNAL_SERVER_ERROR);
    }
}
