package com.datapulse.backend.service;

import com.datapulse.backend.entity.Review;
import com.datapulse.backend.repository.ReviewRepository;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.List;

@Service
public class ReviewService {
    private final ReviewRepository reviewRepository;

    public ReviewService(ReviewRepository reviewRepository) {
        this.reviewRepository = reviewRepository;
    }

    public List<Review> getAll() {
        return reviewRepository.findAll();
    }

    public List<Review> getByProduct(Long productId) {
        return reviewRepository.findByProduct_Id(productId);
    }

    public List<Review> getMyReviews(String email) {
        return reviewRepository.findByUser_Email(email);
    }

    public Review create(Review review) {
        review.setDate(LocalDate.now());
        return reviewRepository.save(review);
    }

    public Review respondToReview(Long id, String response) {
        Review review = reviewRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Review not found"));
        review.setStoreResponse(response);
        return reviewRepository.save(review);
    }
}
