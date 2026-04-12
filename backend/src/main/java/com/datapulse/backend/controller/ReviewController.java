package com.datapulse.backend.controller;

import com.datapulse.backend.entity.Review;
import com.datapulse.backend.repository.ReviewRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/reviews")
@CrossOrigin(origins = "http://localhost:4200")
public class ReviewController {

    private final ReviewRepository reviewRepository;

    public ReviewController(ReviewRepository reviewRepository) {
        this.reviewRepository = reviewRepository;
    }

    @GetMapping
    public List<Review> getAllReviews() {
        return reviewRepository.findAll();
    }

    @GetMapping("/{id}")
    public ResponseEntity<Review> getReview(@PathVariable Long id) {
        return reviewRepository.findById(id).map(ResponseEntity::ok).orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public Review createReview(@RequestBody Review review) {
        return reviewRepository.save(review);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAuthority('ADMIN') or hasAuthority('CORPORATE')")
    public ResponseEntity<Review> updateReview(@PathVariable Long id, @RequestBody Review request) {
        return reviewRepository.findById(id).map(existing -> {
            existing.setComment(request.getComment());
            existing.setRating(request.getRating());
            existing.setSentiment(request.getSentiment());
            existing.setDate(request.getDate());
            existing.setProduct(request.getProduct());
            return ResponseEntity.ok(reviewRepository.save(existing));
        }).orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAuthority('ADMIN') or hasAuthority('CORPORATE')")
    public ResponseEntity<Void> deleteReview(@PathVariable Long id) {
        if (!reviewRepository.existsById(id)) return ResponseEntity.notFound().build();
        reviewRepository.deleteById(id);
        return ResponseEntity.noContent().build();
    }
}
