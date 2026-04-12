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

    private Integer rating; // 1-5 arası yıldız puanı

    private String sentiment; // Positive, Negative, Neutral (AI/ETL tarafından doldurulacak)

    @Column(name = "review_date")
    private LocalDate date; // Yorum tarihi

    @ManyToOne
    @JoinColumn(name = "product_id")
    @JsonIgnore
    private Product product; // Hangi ürün için yapıldığı

    // Boş Constructor (JPA için zorunlu)
    public Review() {
    }

    // Getter ve Setterlar
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getComment() { return comment; }
    public void setComment(String comment) { this.comment = comment; }

    public Integer getRating() { return rating; }
    public void setRating(Integer rating) { this.rating = rating; }

    public String getSentiment() { return sentiment; }
    public void setSentiment(String sentiment) { this.sentiment = sentiment; }

    public LocalDate getDate() { return date; }
    public void setDate(LocalDate date) { this.date = date; }

    public Product getProduct() { return product; }
    public void setProduct(Product product) { this.product = product; }
}