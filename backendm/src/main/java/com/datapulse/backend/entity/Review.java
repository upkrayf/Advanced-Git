package com.datapulse.backend.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import java.time.LocalDate;

@Entity
@Table(name = "reviews")
public class Review {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(length = 1000)
    private String comment; // Müşteri yorumu (Kaggle DS6)

    @Column(name = "review_headline", length = 255)
    private String reviewHeadline; // DS6: review_headline (yorum başlığı)

    private Integer rating; // 1-5 arası yıldız puanı

    private String sentiment; // Positive, Negative, Neutral

    @Column(name = "review_date")
    private LocalDate date; // Yorum tarihi

    @ManyToOne
    @JoinColumn(name = "product_id")
    @JsonIgnore
    private Product product; // Hangi ürün için yapıldığı

    @ManyToOne
    @JoinColumn(name = "user_id")
    @JsonIgnore
    private User user; // Yorumu yapan kullanıcı

    // Boş Constructor (JPA için zorunlu)
    public Review() {
    }

    // Getter ve Setterlar
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getComment() { return comment; }
    public void setComment(String comment) { this.comment = comment; }

    public String getReviewHeadline() { return reviewHeadline; }
    public void setReviewHeadline(String reviewHeadline) { this.reviewHeadline = reviewHeadline; }

    public Integer getRating() { return rating; }
    public void setRating(Integer rating) { this.rating = rating; }

    public String getSentiment() { return sentiment; }
    public void setSentiment(String sentiment) { this.sentiment = sentiment; }

    public LocalDate getDate() { return date; }
    public void setDate(LocalDate date) { this.date = date; }

    public Product getProduct() { return product; }
    public void setProduct(Product product) { this.product = product; }

    public User getUser() { return user; }
    public void setUser(User user) { this.user = user; }

    // --- Frontend DTO uyumluluğu için JSON Property eşleştirmeleri ---

    @com.fasterxml.jackson.annotation.JsonProperty("userId")
    public Long getUserId() {
        return user != null ? user.getId() : null;
    }

    @com.fasterxml.jackson.annotation.JsonProperty("userName")
    public String getUserName() {
        if (user != null) {
            return user.getFullName() != null && !user.getFullName().isEmpty() ? user.getFullName() : "Kullanıcı (" + user.getEmail() + ")";
        }
        return "İsimsiz Kullanıcı";
    }

    @com.fasterxml.jackson.annotation.JsonProperty("productId")
    public Long getProductId() {
        return product != null ? product.getId() : null;
    }

    @Column(name = "store_response", length = 1000)
    private String storeResponse;

    @com.fasterxml.jackson.annotation.JsonProperty("createdAt")
    public LocalDate getCreatedAt() {
        return date;
    }

    public String getStoreResponse() { return storeResponse; }
    public void setStoreResponse(String storeResponse) { this.storeResponse = storeResponse; }
}