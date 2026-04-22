package com.datapulse.backend.entity;
import java.util.List;
import jakarta.persistence.*;
import com.fasterxml.jackson.annotation.JsonIgnore;

@Entity
@Table(name = "stores")
public class Store {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name;

    private String status; // Active, Inactive

    @OneToOne
    @JoinColumn(name = "owner_id")
    private User owner; // Mağaza sahibi olan "Corporate" kullanıcı

    @OneToMany(mappedBy = "store")
    @JsonIgnore
    private List<Product> products;

    public Store() {}

    public List<Product> getProducts() { return products; }
    public void setProducts(List<Product> products) { this.products = products; }

    // Getter ve Setterlar
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public User getOwner() { return owner; }
    public void setOwner(User owner) { this.owner = owner; }
}