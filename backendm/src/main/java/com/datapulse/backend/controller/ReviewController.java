package com.datapulse.backend.controller;

import com.datapulse.backend.entity.Review;
import com.datapulse.backend.service.ReviewService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/reviews")
public class ReviewController {
    private final ReviewService reviewService;

    public ReviewController(ReviewService reviewService) {
        this.reviewService = reviewService;
    }

    @GetMapping
    public ResponseEntity<List<Review>> getAll() {
        return ResponseEntity.ok(reviewService.getAll());
    }

    @GetMapping("/my")
    public ResponseEntity<List<Review>> getMyReviews(Authentication authentication) {
        return ResponseEntity.ok(reviewService.getMyReviews(authentication.getName()));
    }

    @GetMapping("/product/{productId}")
    public ResponseEntity<List<Review>> getByProduct(@PathVariable Long productId) {
        return ResponseEntity.ok(reviewService.getByProduct(productId));
    }

    @PostMapping
    @PreAuthorize("hasAuthority('INDIVIDUAL')")
    public ResponseEntity<Review> create(@RequestBody Review review) {
        return ResponseEntity.ok(reviewService.create(review));
    }

    @PostMapping("/{id}/respond")
    @PreAuthorize("hasAuthority('CORPORATE')")
    public ResponseEntity<Review> respond(@PathVariable Long id, @RequestBody java.util.Map<String, String> body) {
        String response = body.getOrDefault("storeResponse", body.get("response"));
        return ResponseEntity.ok(reviewService.respondToReview(id, response));
    }
}
