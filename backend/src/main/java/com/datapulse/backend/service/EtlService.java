package com.datapulse.backend.service;

import com.datapulse.backend.entity.*;
import com.datapulse.backend.repository.*;
import com.opencsv.CSVParser;
import com.opencsv.CSVParserBuilder;
import com.opencsv.CSVReader;
import com.opencsv.CSVReaderBuilder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.FileReader;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;

@Service
public class EtlService {

    private final UserRepository userRepository;
    private final CustomerProfileRepository customerProfileRepository;
    private final CategoryRepository categoryRepository;
    private final ProductRepository productRepository;
    private final OrderRepository orderRepository;
    private final OrderItemRepository orderItemRepository;
    private final PaymentRepository paymentRepository;
    private final ShipmentRepository shipmentRepository;
    private final ReviewRepository reviewRepository;

    public EtlService(UserRepository userRepository,
                      CustomerProfileRepository customerProfileRepository,
                      CategoryRepository categoryRepository,
                      ProductRepository productRepository,
                      OrderRepository orderRepository,
                      OrderItemRepository orderItemRepository,
                      PaymentRepository paymentRepository,
                      ShipmentRepository shipmentRepository,
                      ReviewRepository reviewRepository) {
        this.userRepository = userRepository;
        this.customerProfileRepository = customerProfileRepository;
        this.categoryRepository = categoryRepository;
        this.productRepository = productRepository;
        this.orderRepository = orderRepository;
        this.orderItemRepository = orderItemRepository;
        this.paymentRepository = paymentRepository;
        this.shipmentRepository = shipmentRepository;
        this.reviewRepository = reviewRepository;
    }

    @Transactional
    public void runEtl() {
        System.out.println("ETL Process Started...");
        try {
            loadDs1();
            loadDs2();
            loadDs3();
            loadDs4();
            loadDs5();
            loadDs6();
            System.out.println("ETL Process Completed Successfully!");
        } catch (Exception e) {
            e.printStackTrace();
            System.out.println("ETL Process Failed: " + e.getMessage());
        }
    }

    private void loadDs1() throws Exception {
        String file = "src/main/resources/data/ds1.csv";
        System.out.println("Loading " + file);
        try (CSVReader reader = new CSVReader(new FileReader(file))) {
            reader.readNext(); // skip header
            String[] line;
            int count = 0;
            while ((line = reader.readNext()) != null && count < 1000) {
                if (line.length < 8) continue;
                String invoice = line[0];
                String stockCode = line[1];
                String description = line[2];
                String quantityStr = line[3];
                String priceStr = line[5];
                String customerId = line[6];

                if (customerId == null || customerId.trim().isEmpty()) continue;

                // User
                String email = "ds1_" + customerId.replace(".0", "") + "@dummy.com";
                User user = userRepository.findByEmail(email).orElse(null);
                if (user == null) {
                    user = new User(email, "123", "INDIVIDUAL", null);
                    user = userRepository.save(user);
                }

                // Category (Dummy for ds1)
                Category category = categoryRepository.findByName("General").orElse(null);
                if (category == null) {
                    category = new Category();
                    category.setName("General");
                    category = categoryRepository.save(category);
                }

                // Product
                Product product = productRepository.findBySku(stockCode).orElse(null);
                if (product == null) {
                    product = new Product();
                    product.setSku(stockCode);
                    product.setName(description);
                    product.setUnitPrice(new BigDecimal(priceStr));
                    product.setStockQuantity(100);
                    product.setCategory(category);
                    product = productRepository.save(product);
                }

                // Order
                Order order = orderRepository.findByOrderNumber(invoice).orElse(null);
                if (order == null) {
                    order = new Order();
                    order.setOrderNumber(invoice);
                    order.setUser(user);
                    order.setGrandTotal(BigDecimal.ZERO);
                    order.setStatus("COMPLETED");
                    order.setOrderDate(LocalDateTime.now());
                    order = orderRepository.save(order);
                }

                // OrderItem
                OrderItem item = new OrderItem();
                item.setOrder(order);
                item.setProduct(product);
                int qty = (int) Math.abs(Double.parseDouble(quantityStr));
                item.setQuantity(qty);
                item.setPrice(product.getUnitPrice());
                orderItemRepository.save(item);

                // Update Order Total
                BigDecimal addTotal = product.getUnitPrice().multiply(new BigDecimal(qty));
                order.setGrandTotal(order.getGrandTotal().add(addTotal));
                orderRepository.save(order);

                count++;
            }
        }
    }

    private void loadDs2() throws Exception {
        String file = "src/main/resources/data/ds2.csv";
        System.out.println("Loading " + file);
        try (CSVReader reader = new CSVReader(new FileReader(file))) {
            reader.readNext(); // skip header
            String[] line;
            int count = 0;
            while ((line = reader.readNext()) != null && count < 1000) {
                if (line.length < 11) continue;
                String customerId = line[0];
                String gender = line[1];
                String ageStr = line[2];
                String city = line[3];
                String membership = line[4];

                String email = "ds2_" + customerId + "@dummy.com";
                User user = userRepository.findByEmail(email).orElse(null);
                if (user == null) {
                    user = new User(email, "hashed_password", "INDIVIDUAL", gender);
                    user = userRepository.save(user);
                }

                if (user.getProfile() == null) {
                    CustomerProfile profile = new CustomerProfile();
                    profile.setUser(user);
                    profile.setAge(Integer.parseInt(ageStr));
                    profile.setCity(city);
                    profile.setMembershipType(membership);
                    customerProfileRepository.save(profile);
                    user.setProfile(profile);
                    userRepository.save(user);
                }

                count++;
            }
        }
    }

    private void loadDs3() throws Exception {
        String file = "src/main/resources/data/ds3.csv";
        System.out.println("Loading " + file);
        try (CSVReader reader = new CSVReader(new FileReader(file))) {
            reader.readNext(); // skip header
            String[] line;
            int count = 0;
            while ((line = reader.readNext()) != null && count < 1000) {
                if (line.length < 12) continue;
                String warehouseBlock = line[1];
                String modeOfShipment = line[2];
                String productImportance = line[7];
                String reachedOnTimeStr = line[11];

                Shipment shipment = new Shipment();
                shipment.setWarehouseBlock(warehouseBlock);
                shipment.setModeOfShipment(modeOfShipment);
                shipment.setProductImportance(productImportance);
                shipment.setReachingOnTime(Integer.parseInt(reachedOnTimeStr));
                shipment = shipmentRepository.save(shipment);

                // Create dummy order to attach shipment
                Order order = new Order();
                order.setOrderNumber("DS3_DUMMY_" + count);
                order.setGrandTotal(BigDecimal.ZERO);
                order.setStatus("SHIPPED");
                order.setOrderDate(LocalDateTime.now());
                order.setShipment(shipment);
                orderRepository.save(order);

                count++;
            }
        }
    }

    private void loadDs4() throws Exception {
        String file = "src/main/resources/data/ds4.csv";
        System.out.println("Loading " + file);
        try (CSVReader reader = new CSVReader(new FileReader(file))) {
            reader.readNext(); // skip header
            String[] line;
            int count = 0;
            while ((line = reader.readNext()) != null && count < 1000) {
                if (line.length < 16) continue;
                String orderId = line[2];
                String status = line[4];
                String sku = line[9];
                String categoryStr = line[10];
                String qtyStr = line[13];
                String amountStr = line[15];

                if (sku == null || sku.trim().isEmpty()) continue;
                if (orderId == null || orderId.trim().isEmpty()) continue;

                Category category = categoryRepository.findByName(categoryStr).orElse(null);
                if (category == null) {
                    category = new Category();
                    category.setName(categoryStr);
                    category = categoryRepository.save(category);
                }

                Product product = productRepository.findBySku(sku).orElse(null);
                if (product == null) {
                    product = new Product();
                    product.setSku(sku);
                    product.setName("Amazon Product " + sku);
                    double amount = amountStr.isEmpty() ? 0.0 : Double.parseDouble(amountStr);
                    int qty = qtyStr.isEmpty() ? 1 : Integer.parseInt(qtyStr);
                    double unitPrice = qty > 0 ? amount / qty : amount;
                    product.setUnitPrice(new BigDecimal(unitPrice));
                    product.setStockQuantity(100);
                    product.setCategory(category);
                    product = productRepository.save(product);
                }

                Order order = orderRepository.findByOrderNumber(orderId).orElse(null);
                if (order == null) {
                    order = new Order();
                    order.setOrderNumber(orderId);
                    order.setGrandTotal(BigDecimal.ZERO);
                    order.setStatus(status);
                    order.setOrderDate(LocalDateTime.now());
                    order = orderRepository.save(order);
                }

                int qty = qtyStr.isEmpty() ? 1 : Integer.parseInt(qtyStr);
                OrderItem item = new OrderItem();
                item.setOrder(order);
                item.setProduct(product);
                item.setQuantity(qty);
                item.setPrice(product.getUnitPrice());
                orderItemRepository.save(item);

                BigDecimal addTotal = product.getUnitPrice().multiply(new BigDecimal(qty));
                order.setGrandTotal(order.getGrandTotal().add(addTotal));
                orderRepository.save(order);

                count++;
            }
        }
    }

    private void loadDs5() throws Exception {
        String file = "src/main/resources/data/ds5.csv";
        System.out.println("Loading " + file);
        try (CSVReader reader = new CSVReader(new FileReader(file))) {
            reader.readNext(); // skip header
            String[] line;
            int count = 0;
            while ((line = reader.readNext()) != null && count < 1000) {
                if (line.length < 12) continue;
                String status = line[1];
                String sku = line[3];
                String priceStr = line[4];
                String qtyStr = line[5];
                String grandTotalStr = line[6];
                String incrementId = line[7]; // Order ID
                String categoryStr = line[8];
                String paymentMethodStr = line[11];

                if (sku == null || sku.trim().isEmpty()) continue;
                if (incrementId == null || incrementId.trim().isEmpty()) continue;

                Category category = categoryRepository.findByName(categoryStr).orElse(null);
                if (category == null) {
                    category = new Category();
                    category.setName(categoryStr);
                    category = categoryRepository.save(category);
                }

                Product product = productRepository.findBySku(sku).orElse(null);
                if (product == null) {
                    product = new Product();
                    product.setSku(sku);
                    product.setName("Pakistani Product " + sku);
                    double price = priceStr.isEmpty() ? 0.0 : Double.parseDouble(priceStr);
                    product.setUnitPrice(new BigDecimal(price));
                    product.setStockQuantity(100);
                    product.setCategory(category);
                    product = productRepository.save(product);
                }

                Order order = orderRepository.findByOrderNumber(incrementId).orElse(null);
                if (order == null) {
                    order = new Order();
                    order.setOrderNumber(incrementId);
                    double grandTotal = grandTotalStr.isEmpty() ? 0.0 : Double.parseDouble(grandTotalStr);
                    order.setGrandTotal(new BigDecimal(grandTotal));
                    order.setStatus(status);
                    order.setOrderDate(LocalDateTime.now());
                    order = orderRepository.save(order);

                    Payment payment = new Payment();
                    payment.setPaymentValue(order.getGrandTotal());
                    payment.setPaymentType(paymentMethodStr);
                    payment.setOrder(order);
                    paymentRepository.save(payment);
                }

                int qty = qtyStr.isEmpty() ? 1 : (int) Math.round(Double.parseDouble(qtyStr));
                OrderItem item = new OrderItem();
                item.setOrder(order);
                item.setProduct(product);
                item.setQuantity(qty);
                item.setPrice(product.getUnitPrice());
                orderItemRepository.save(item);

                count++;
            }
        }
    }

    private void loadDs6() throws Exception {
        String file = "src/main/resources/data/ds6.tsv";
        System.out.println("Loading " + file);
        CSVParser parser = new CSVParserBuilder().withSeparator('\t').build();
        try (CSVReader reader = new CSVReaderBuilder(new FileReader(file)).withCSVParser(parser).build()) {
            reader.readNext(); // skip header
            String[] line;
            int count = 0;
            while ((line = reader.readNext()) != null && count < 1000) {
                if (line.length < 15) continue;
                String customerId = line[1];
                String productId = line[3];
                String productTitle = line[5];
                String categoryStr = line[6];
                String starRating = line[7];
                String reviewBody = line[13];
                String reviewDateStr = line[14];

                String email = "ds6_" + customerId + "@dummy.com";
                User user = userRepository.findByEmail(email).orElse(null);
                if (user == null) {
                    user = new User(email, "hashed_password", "INDIVIDUAL", null);
                    user = userRepository.save(user);
                }

                Category category = categoryRepository.findByName(categoryStr).orElse(null);
                if (category == null) {
                    category = new Category();
                    category.setName(categoryStr);
                    category = categoryRepository.save(category);
                }

                Product product = productRepository.findBySku(productId).orElse(null);
                if (product == null) {
                    product = new Product();
                    product.setSku(productId);
                    product.setName(productTitle);
                    product.setUnitPrice(new BigDecimal("10.0")); // Dummy price
                    product.setStockQuantity(100);
                    product.setCategory(category);
                    product = productRepository.save(product);
                }

                Review review = new Review();
                review.setRating(Integer.parseInt(starRating));
                if (reviewBody.length() > 999) {
                    reviewBody = reviewBody.substring(0, 999);
                }
                review.setComment(reviewBody);
                review.setSentiment(Integer.parseInt(starRating) >= 3 ? "Positive" : "Negative");
                review.setDate(LocalDate.parse(reviewDateStr, DateTimeFormatter.ofPattern("yyyy-MM-dd")));
                review.setProduct(product);
                reviewRepository.save(review);

                count++;
            }
        }
    }
}
