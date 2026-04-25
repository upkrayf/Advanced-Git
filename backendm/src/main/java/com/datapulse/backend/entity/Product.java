package com.datapulse.backend.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.fasterxml.jackson.annotation.JsonAlias;
import jakarta.persistence.*;
import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "products", indexes = {
    @Index(name = "idx_product_sku", columnList = "sku"),
    @Index(name = "idx_product_name", columnList = "name"),
    @Index(name = "idx_product_category", columnList = "category_id"),
    @Index(name = "idx_product_store", columnList = "store_id")
})
public class Product {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "sku", unique = true)
    private String sku; // Amazon ve Pakistan verileri için anahtar sütun

    @Column(nullable = false)
    private String name;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(name = "unit_price", nullable = false)
    private BigDecimal unitPrice;

    @Column(name = "cost")
    private BigDecimal cost; // DS3 cost of the product

    @Column(name = "stock_quantity")
    private Integer stockQuantity;

    @ManyToOne
    @JoinColumn(name = "category_id")
    private Category category;

    @ManyToOne
    @JoinColumn(name = "store_id")
    private Store store;

    @OneToMany(mappedBy = "product", cascade = CascadeType.ALL)
    @JsonIgnore
    private List<Review> reviews;

    @Column(name = "icon")
    private String icon;

    @Column(name = "is_active")
    private Boolean isActive = true;

    public Product() {}

    // --- GETTER VE SETTERLAR ---
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getSku() { return sku; }
    public void setSku(String sku) { this.sku = sku; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    public BigDecimal getUnitPrice() { return unitPrice; }
    public void setUnitPrice(BigDecimal unitPrice) { this.unitPrice = unitPrice; }
    public BigDecimal getCost() { return cost; }
    public void setCost(BigDecimal cost) { this.cost = cost; }
    public Integer getStockQuantity() { return stockQuantity; }
    public void setStockQuantity(Integer stockQuantity) { this.stockQuantity = stockQuantity; }
    public Category getCategory() { return category; }
    public void setCategory(Category category) { this.category = category; }
    public String getIcon() { return icon; }
    public void setIcon(String icon) { this.icon = icon; }
    public Store getStore() {return store;}
    public void setStore(Store store) {this.store = store;}
    public List<Review> getReviews() { return reviews; }
    public void setReviews(List<Review> reviews) { this.reviews = reviews; }
    public Boolean getIsActive() { return isActive; }
    public void setIsActive(Boolean isActive) { this.isActive = isActive; }

    // Frontend uyumu için alias getter'lar
    @JsonProperty("price")
    public BigDecimal getPrice() { return unitPrice; }

    @JsonProperty("stock")
    public Integer getStock() { return stockQuantity; }

    @JsonProperty("categoryName")
    public String getCategoryName() { return category != null ? category.getName() : null; }

    @JsonProperty("imageUrl")
    public String getImageUrl() {
        return icon != null && !icon.isBlank() ? icon : "https://via.placeholder.com/300x300.png?text=Ütün+Görseli";
    }

    @JsonProperty("storeName")
    public String getStoreName() { return store != null ? store.getName() : null; }

    @JsonProperty("price")
    public void setPrice(BigDecimal price) { this.unitPrice = price; }

    @JsonProperty("stock")
    public void setStock(Integer stock) { this.stockQuantity = stock; }

    @JsonProperty("imageUrl")
    public void setImageUrl(String imageUrl) { this.icon = imageUrl; }

    @JsonProperty("categoryId")
    public void setCategoryId(Long categoryId) {
        if (categoryId != null) {
            Category c = new Category();
            c.setId(categoryId);
            this.category = c;
        }
    }
}