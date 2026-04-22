package com.datapulse.backend.service;

import com.datapulse.backend.entity.*;
import com.datapulse.backend.repository.*;
import org.springframework.core.io.ClassPathResource;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeParseException;
import java.util.*;
import java.util.logging.Logger;

@Service
public class EtlService {

    private static final Logger log = Logger.getLogger(EtlService.class.getName());

    private final UserRepository userRepository;
    private final ProductRepository productRepository;
    private final CategoryRepository categoryRepository;
    private final OrderRepository orderRepository;
    private final OrderItemRepository orderItemRepository;
    private final CustomerProfileRepository customerProfileRepository;
    private final StoreRepository storeRepository;
    private final ReviewRepository reviewRepository;
    private final PaymentRepository paymentRepository;
    private final ShipmentRepository shipmentRepository;
    private final RefreshTokenRepository refreshTokenRepository;
    private final PasswordEncoder passwordEncoder;

    public EtlService(UserRepository userRepository,
                      ProductRepository productRepository,
                      CategoryRepository categoryRepository,
                      OrderRepository orderRepository,
                      OrderItemRepository orderItemRepository,
                      CustomerProfileRepository customerProfileRepository,
                      StoreRepository storeRepository,
                      ReviewRepository reviewRepository,
                      PaymentRepository paymentRepository,
                      ShipmentRepository shipmentRepository,
                      RefreshTokenRepository refreshTokenRepository,
                      PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.productRepository = productRepository;
        this.categoryRepository = categoryRepository;
        this.orderRepository = orderRepository;
        this.orderItemRepository = orderItemRepository;
        this.customerProfileRepository = customerProfileRepository;
        this.storeRepository = storeRepository;
        this.reviewRepository = reviewRepository;
        this.paymentRepository = paymentRepository;
        this.shipmentRepository = shipmentRepository;
        this.refreshTokenRepository = refreshTokenRepository;
        this.passwordEncoder = passwordEncoder;
    }

    public void runEtl() {
        log.info("ETL başlıyor — tüm tablolar temizleniyor...");
        clearAll();

        String encodedPassword = passwordEncoder.encode("123");

        log.info("Sistem kullanıcıları ve mağazalar oluşturuluyor...");
        Map<String, Object[]> setup = createSystemSetup(encodedPassword);
        User ukCorp      = (User) setup.get("ukCorp")[0];
        User indiaCorp   = (User) setup.get("indiaCorp")[0];
        User pakCorp     = (User) setup.get("pakCorp")[0];
        Store ukStore    = (Store) setup.get("ukCorp")[1];
        Store indiaStore = (Store) setup.get("indiaCorp")[1];
        Store pakStore   = (Store) setup.get("pakCorp")[1];

        log.info("DS1 yükleniyor (UK Retail)...");
        loadDs1(encodedPassword, ukStore);

        log.info("DS2 yükleniyor (Müşteri Demografisi)...");
        loadDs2(encodedPassword);

        log.info("DS3 yükleniyor (Kargo/Sevkiyat)...");
        loadDs3(encodedPassword);

        log.info("DS4 yükleniyor (Amazon Hindistan)...");
        loadDs4(indiaCorp, indiaStore);

        log.info("DS5 yükleniyor (Pakistan E-Ticaret)...");
        loadDs5(encodedPassword, pakCorp, pakStore);

        log.info("DS6 yükleniyor (Amazon Yorumları)...");
        loadDs6(encodedPassword, ukStore);

        log.info("ETL tamamlandı.");
    }

    // ─── Temizlik ─────────────────────────────────────────────────────────────

    private void clearAll() {
        // Deletion order respects FK constraints: child tables first, then parents
        refreshTokenRepository.deleteAllInBatch();     // → users (must be first)
        reviewRepository.deleteAllInBatch();           // → products, users
        paymentRepository.deleteAllInBatch();          // → orders
        orderItemRepository.deleteAllInBatch();        // → orders, products
        orderRepository.deleteAllInBatch();            // → users, shipments
        shipmentRepository.deleteAllInBatch();         // no more references
        customerProfileRepository.deleteAllInBatch();  // → users
        productRepository.deleteAllInBatch();          // → categories, stores
        storeRepository.deleteAllInBatch();            // → users
        categoryRepository.deleteAllInBatch();         // self-ref parent_id (all NULL)
        userRepository.deleteAllInBatch();             // root table
    }

    // ─── Sistem Kurulumu ──────────────────────────────────────────────────────

    private Map<String, Object[]> createSystemSetup(String encodedPassword) {
        // Admin
        User admin = userRepository.save(new User("admin@datapulse.com", encodedPassword, "ADMIN", null, "Platform Admin"));

        // Corporate users
        User ukCorp    = userRepository.save(new User("uk@datapulse.com",       encodedPassword, "CORPORATE", null, "UK Retail Manager"));
        User indiaCorp = userRepository.save(new User("india@datapulse.com",    encodedPassword, "CORPORATE", null, "India Amazon Manager"));
        User pakCorp   = userRepository.save(new User("pakistan@datapulse.com", encodedPassword, "CORPORATE", null, "Pakistan E-Commerce Manager"));

        // Stores
        Store ukStore    = createStore("UK Retail Store",        "Active", ukCorp);
        Store indiaStore = createStore("Amazon India Store",     "Active", indiaCorp);
        Store pakStore   = createStore("Pakistan E-Commerce",    "Active", pakCorp);

        Map<String, Object[]> result = new HashMap<>();
        result.put("ukCorp",    new Object[]{ukCorp,    ukStore});
        result.put("indiaCorp", new Object[]{indiaCorp, indiaStore});
        result.put("pakCorp",   new Object[]{pakCorp,   pakStore});
        return result;
    }

    private Store createStore(String name, String status, User owner) {
        Store store = new Store();
        store.setName(name);
        store.setStatus(status);
        store.setOwner(owner);
        return storeRepository.save(store);
    }

    // ─── DS1: UK Retail (Invoice, StockCode, Description, Quantity, InvoiceDate, Price, CustomerID, Country) ──

    private void loadDs1(String encodedPassword, Store ukStore) {
        Category retailCat = getOrCreateCategory("Retail", null);
        Map<String, Product>  productMap = new HashMap<>();
        Map<String, User>     userMap    = new HashMap<>();
        Map<String, Order>    orderMap   = new HashMap<>();
        int rowLimit = 5000;
        int count    = 0;

        try (BufferedReader br = new BufferedReader(new InputStreamReader(
                new ClassPathResource("data/ds1.csv").getInputStream(), "UTF-8"))) {

            String line = br.readLine(); // header
            while ((line = br.readLine()) != null && count < rowLimit) {
                String[] cols = splitCsv(line);
                if (cols.length < 7) continue;

                String invoice    = cols[0].trim();
                String stockCode  = cols[1].trim();
                String desc       = cols[2].trim();
                String qtyStr     = cols[3].trim();
                String dateStr    = cols[4].trim();
                String priceStr   = cols[5].trim();
                String customerRaw= cols[6].trim();

                if (invoice.isBlank() || stockCode.isBlank() || customerRaw.isBlank()) continue;
                String customerId = customerRaw.replace(".0", "").trim();
                if (customerId.isBlank()) continue;

                int qty;
                BigDecimal price;
                try {
                    qty   = Integer.parseInt(qtyStr);
                    price = new BigDecimal(priceStr);
                } catch (NumberFormatException e) { continue; }
                if (qty <= 0 || price.compareTo(BigDecimal.ZERO) <= 0) continue;

                // Product
                Product product = productMap.computeIfAbsent(stockCode, sku -> {
                    Product p = new Product();
                    p.setSku(sku);
                    p.setName(desc.isEmpty() ? sku : (desc.length() > 255 ? desc.substring(0, 255) : desc));
                    p.setUnitPrice(price);
                    p.setStockQuantity(100);
                    p.setCategory(retailCat);
                    p.setStore(ukStore);
                    return productRepository.save(p);
                });

                // User
                String email = "customer" + customerId + "@retail.co.uk";
                User user = userMap.computeIfAbsent(email, e -> {
                    User u = new User(e, encodedPassword, "INDIVIDUAL", null, "Customer " + customerId);
                    return userRepository.save(u);
                });

                // Order
                Order order = orderMap.computeIfAbsent(invoice, inv -> {
                    Order o = new Order();
                    o.setOrderNumber(inv);
                    o.setOrderDate(parseDateTime(dateStr));
                    o.setStatus("DELIVERED");
                    o.setTotalAmount(BigDecimal.ZERO);
                    o.setUser(user);
                    return orderRepository.save(o);
                });

                // OrderItem
                OrderItem item = new OrderItem();
                item.setOrder(order);
                item.setProduct(product);
                item.setQuantity(qty);
                item.setPrice(price);
                orderItemRepository.save(item);

                // Update totalAmount
                order.setTotalAmount(order.getTotalAmount().add(price.multiply(BigDecimal.valueOf(qty))));
                orderRepository.save(order);

                count++;
            }
        } catch (Exception e) {
            log.warning("DS1 hatası: " + e.getMessage());
        }
        log.info("DS1: " + count + " satır yüklendi, " + productMap.size() + " ürün, " + userMap.size() + " kullanıcı.");
    }

    // ─── DS2: Customer Demographics (CustomerID, Gender, Age, City, MembershipType, TotalSpend, ...) ──

    private void loadDs2(String encodedPassword) {
        int count = 0;
        try (BufferedReader br = new BufferedReader(new InputStreamReader(
                new ClassPathResource("data/ds2.csv").getInputStream(), "UTF-8"))) {

            String line = br.readLine(); // header
            while ((line = br.readLine()) != null) {
                String[] cols = splitCsv(line);
                if (cols.length < 11) continue;

                String customerId    = cols[0].trim();
                String gender        = cols[1].trim();
                String ageStr        = cols[2].trim();
                String city          = cols[3].trim();
                String membership    = cols[4].trim();
                String totalSpendStr = cols[5].trim();
                String itemsStr      = cols[6].trim();
                String ratingStr     = cols[7].trim();
                String discountStr   = cols[8].trim();
                String daysStr       = cols[9].trim();
                String satisfaction  = cols[10].trim();

                String email = "ds2customer" + customerId + "@shop.com";
                User user = userRepository.findByEmail(email).orElseGet(() -> {
                    User u = new User(email, encodedPassword, "INDIVIDUAL",
                            gender.isEmpty() ? null : gender, "Customer " + customerId);
                    return userRepository.save(u);
                });
                if (!gender.isEmpty()) { user.setGender(gender); userRepository.save(user); }

                CustomerProfile profile = new CustomerProfile();
                profile.setUser(user);
                try { profile.setAge(Integer.parseInt(ageStr)); } catch (NumberFormatException ignored) {}
                profile.setCity(city.isEmpty() ? null : city);
                profile.setMembershipType(membership.isEmpty() ? null : membership);
                try { profile.setTotalSpend(Double.parseDouble(totalSpendStr)); } catch (NumberFormatException ignored) {}
                try { profile.setItemsPurchased(Integer.parseInt(itemsStr)); } catch (NumberFormatException ignored) {}
                try { profile.setAverageRating(Double.parseDouble(ratingStr)); } catch (NumberFormatException ignored) {}
                profile.setDiscountApplied("TRUE".equalsIgnoreCase(discountStr));
                try { profile.setDaysSinceLastPurchase(Integer.parseInt(daysStr)); } catch (NumberFormatException ignored) {}
                profile.setSatisfactionLevel(satisfaction.isEmpty() ? null : satisfaction);
                customerProfileRepository.save(profile);
                count++;
            }
        } catch (Exception e) {
            log.warning("DS2 hatası: " + e.getMessage());
        }
        log.info("DS2: " + count + " müşteri profili yüklendi.");
    }

    // ─── DS3: Shipment Data (ID, Warehouse_block, Mode_of_Shipment, ..., Gender, ..., Weight_in_gms, Reached.on.Time) ──

    private void loadDs3(String encodedPassword) {
        // Header: ID,Warehouse_block,Mode_of_Shipment,Customer_care_calls,Customer_rating,
        //         Cost_of_the_Product,Prior_purchases,Product_importance,Gender,
        //         Discount_offered,Weight_in_gms,Reached.on.Time_Y.N
        Category logisticsCat = getOrCreateCategory("Logistics", null);
        int rowLimit = 2000;
        int count    = 0;

        try (BufferedReader br = new BufferedReader(new InputStreamReader(
                new ClassPathResource("data/ds3.csv").getInputStream(), "UTF-8"))) {

            String headerLine = br.readLine();
            // Handle BOM
            if (headerLine != null && headerLine.startsWith("﻿")) {
                headerLine = headerLine.substring(1);
            }

            String line;
            while ((line = br.readLine()) != null && count < rowLimit) {
                String[] cols = splitCsv(line);
                if (cols.length < 12) continue;

                String id            = cols[0].trim();
                String warehouse     = cols[1].trim();
                String shipMode      = cols[2].trim();
                String ratingStr     = cols[4].trim();
                String costStr       = cols[5].trim();
                String importance    = cols[7].trim();
                String gender        = cols[8].trim();
                String discountStr   = cols[9].trim();
                String weightStr     = cols[10].trim();
                String onTimeStr     = cols[11].trim();

                String email = "ds3user" + id + "@logistics.com";
                User user = userRepository.findByEmail(email).orElseGet(() -> {
                    String g = gender.equals("F") ? "Female" : gender.equals("M") ? "Male" : null;
                    User u = new User(email, encodedPassword, "INDIVIDUAL", g, "Logistics Customer " + id);
                    return userRepository.save(u);
                });

                // Create a synthetic product from shipment cost
                BigDecimal cost = parseBigDecimal(costStr, BigDecimal.valueOf(50));
                Product product = new Product();
                product.setSku("DS3-PROD-" + id);
                product.setName("Product #" + id);
                product.setUnitPrice(cost);
                product.setStockQuantity(50);
                product.setCategory(logisticsCat);
                product = productRepository.save(product);

                // Shipment
                Shipment shipment = new Shipment();
                shipment.setWarehouseBlock(warehouse.isEmpty() ? null : warehouse);
                shipment.setModeOfShipment(shipMode.isEmpty() ? null : shipMode);
                try { shipment.setCustomerRating(Integer.parseInt(ratingStr)); } catch (NumberFormatException ignored) {}
                try { shipment.setDiscountOffered(Integer.parseInt(discountStr)); } catch (NumberFormatException ignored) {}
                try { shipment.setWeightInGms(Integer.parseInt(weightStr)); } catch (NumberFormatException ignored) {}
                try { shipment.setReachingOnTime(Integer.parseInt(onTimeStr)); } catch (NumberFormatException ignored) {}
                shipment.setProductImportance(importance.isEmpty() ? null : importance);
                shipment = shipmentRepository.save(shipment);

                // Order linked to shipment
                Order order = new Order();
                order.setOrderNumber("DS3-ORD-" + id);
                order.setOrderDate(LocalDateTime.now().minusDays((long)(Math.random() * 365)));
                order.setStatus(shipment.getReachingOnTime() != null && shipment.getReachingOnTime() == 1 ? "DELIVERED" : "SHIPPED");
                order.setTotalAmount(cost);
                order.setUser(user);
                order.setShipment(shipment);
                order = orderRepository.save(order);

                // OrderItem
                OrderItem item = new OrderItem();
                item.setOrder(order);
                item.setProduct(product);
                item.setQuantity(1);
                item.setPrice(cost);
                orderItemRepository.save(item);

                count++;
            }
        } catch (Exception e) {
            log.warning("DS3 hatası: " + e.getMessage());
        }
        log.info("DS3: " + count + " sevkiyat yüklendi.");
    }

    // ─── DS4: Amazon India (rowIdx, OrderNumber, Date, Status, ..., SKU, Category, ..., Qty, currency, Amount, city, state, ...) ──

    private void loadDs4(User indiaCorp, Store indiaStore) {
        // DS4 header sütun sıralaması (header adları ile gerçek içerik uyuşmuyor, sıra ile kullanıyoruz):
        // [0]=rowIdx [1]=orderNumber [2]=date(mm-dd-yy) [3]=status [4]=merchant [5]=channel
        // [6]=serviceLevel [7]=style [8]=sku [9]=category [10]=size [11]=asin
        // [12]=shipStatus [13]=qty [14]=currency [15]=amount [16]=city [17]=state
        int rowLimit = 3000;
        int count    = 0;
        Map<String, Product> productMap = new HashMap<>();

        try (BufferedReader br = new BufferedReader(new InputStreamReader(
                new ClassPathResource("data/ds4.csv").getInputStream(), "UTF-8"))) {

            br.readLine(); // header

            String line;
            while ((line = br.readLine()) != null && count < rowLimit) {
                String[] cols = splitCsv(line);
                if (cols.length < 16) continue;

                String orderNum   = cols[1].trim();
                String dateStr    = cols[2].trim();
                String statusRaw  = cols[3].trim();
                String sku        = cols[8].trim();
                String categoryRaw= cols[9].trim();
                String qtyStr     = cols[13].trim();
                String amountStr  = cols[15].trim();

                if (orderNum.isBlank() || sku.isBlank()) continue;

                int qty = 1;
                try { qty = Integer.parseInt(qtyStr); } catch (NumberFormatException ignored) {}
                if (qty <= 0) qty = 1;

                BigDecimal rawAmount = parseBigDecimal(amountStr, BigDecimal.valueOf(500));
                final BigDecimal amount = (rawAmount.compareTo(BigDecimal.ZERO) <= 0) ? BigDecimal.valueOf(500) : rawAmount;

                String categoryName = categoryRaw.isEmpty() ? "Fashion" : capitalize(categoryRaw);
                Category category = getOrCreateCategory(categoryName, null);

                Product product = productMap.computeIfAbsent(sku, s -> {
                    Product p = new Product();
                    p.setSku(s);
                    p.setName(s.length() > 255 ? s.substring(0, 255) : s);
                    p.setUnitPrice(amount);
                    p.setStockQuantity(50);
                    p.setCategory(category);
                    p.setStore(indiaStore);
                    return productRepository.save(p);
                });

                String status = mapDs4Status(statusRaw);
                LocalDateTime orderDate = parseDs4Date(dateStr);

                // Avoid duplicate orders
                if (orderRepository.existsByOrderNumber(orderNum)) {
                    // Add item to existing order
                    Optional<Order> existingOpt = orderRepository.findByOrderNumber(orderNum);
                    if (existingOpt.isPresent()) {
                        Order existing = existingOpt.get();
                        OrderItem item = new OrderItem();
                        item.setOrder(existing);
                        item.setProduct(product);
                        item.setQuantity(qty);
                        item.setPrice(amount);
                        orderItemRepository.save(item);
                        existing.setTotalAmount(existing.getTotalAmount().add(amount.multiply(BigDecimal.valueOf(qty))));
                        orderRepository.save(existing);
                    }
                } else {
                    Order order = new Order();
                    order.setOrderNumber(orderNum);
                    order.setOrderDate(orderDate);
                    order.setStatus(status);
                    order.setTotalAmount(amount.multiply(BigDecimal.valueOf(qty)));
                    order.setUser(indiaCorp);
                    order = orderRepository.save(order);

                    OrderItem item = new OrderItem();
                    item.setOrder(order);
                    item.setProduct(product);
                    item.setQuantity(qty);
                    item.setPrice(amount);
                    orderItemRepository.save(item);
                }
                count++;
            }
        } catch (Exception e) {
            log.warning("DS4 hatası: " + e.getMessage());
        }
        log.info("DS4: " + count + " satır yüklendi, " + productMap.size() + " ürün.");
    }

    // ─── DS5: Pakistan E-Commerce (item_id, status, created_at, sku, price, qty_ordered, grand_total, increment_id, category_name_1, ..., payment_method, ..., Customer ID) ──

    private void loadDs5(String encodedPassword, User pakCorp, Store pakStore) {
        int rowLimit = 3000;
        int count    = 0;
        Map<String, Product> productMap = new HashMap<>();
        Map<String, User>    userMap    = new HashMap<>();
        Map<String, Order>   orderMap   = new HashMap<>();

        try (BufferedReader br = new BufferedReader(new InputStreamReader(
                new ClassPathResource("data/ds5.csv").getInputStream(), "UTF-8"))) {

            br.readLine(); // header

            String line;
            while ((line = br.readLine()) != null && count < rowLimit) {
                String[] cols = splitCsv(line);
                if (cols.length < 12) continue;

                String statusRaw    = cols[1].trim();
                String sku          = cols[3].trim();
                String priceStr     = cols[4].trim();
                String qtyStr       = cols[5].trim();
                String totalAmountStr= cols[6].trim();
                String orderNum     = cols[7].trim();
                String categoryName = cols[8].trim();
                String paymentMethod= cols[11].trim();
                String customerId   = cols.length > 20 ? cols[20].trim() : "";

                if (sku.isBlank() || orderNum.isBlank()) continue;

                BigDecimal price      = parseBigDecimal(priceStr, BigDecimal.valueOf(100));
                BigDecimal totalAmountVal = parseBigDecimal(totalAmountStr, price);
                int qty = 1;
                try { qty = (int) Double.parseDouble(qtyStr); } catch (NumberFormatException ignored) {}
                if (qty <= 0) qty = 1;

                String catName = categoryName.isEmpty() ? "General" : capitalize(categoryName);
                Category category = getOrCreateCategory(catName, null);

                Product product = productMap.computeIfAbsent(sku, s -> {
                    Product p = new Product();
                    p.setSku(s);
                    p.setName(s.length() > 255 ? s.substring(0, 255) : s);
                    p.setUnitPrice(price);
                    p.setStockQuantity(100);
                    p.setCategory(category);
                    p.setStore(pakStore);
                    return productRepository.save(p);
                });

                User user;
                if (!customerId.isBlank()) {
                    String email = "ds5customer" + customerId + "@ecommerce.pk";
                    user = userMap.computeIfAbsent(email, e -> {
                        User u = new User(e, encodedPassword, "INDIVIDUAL", null, "Customer " + customerId);
                        return userRepository.save(u);
                    });
                } else {
                    user = pakCorp;
                }

                Order order = orderMap.computeIfAbsent(orderNum, inv -> {
                    Order o = new Order();
                    o.setOrderNumber(inv);
                    o.setOrderDate(LocalDateTime.now().minusDays((long)(Math.random() * 730)));
                    o.setStatus(mapDs5Status(statusRaw));
                    o.setTotalAmount(totalAmountVal);
                    o.setUser(user);
                    Order saved = orderRepository.save(o);

                    if (!paymentMethod.isBlank()) {
                        Payment payment = new Payment();
                        payment.setOrder(saved);
                        payment.setPaymentType(paymentMethod);
                        payment.setAmount(totalAmountVal);
                        paymentRepository.save(payment);
                    }
                    return saved;
                });

                OrderItem item = new OrderItem();
                item.setOrder(order);
                item.setProduct(product);
                item.setQuantity(qty);
                item.setPrice(price);
                orderItemRepository.save(item);

                count++;
            }
        } catch (Exception e) {
            log.warning("DS5 hatası: " + e.getMessage());
        }
        log.info("DS5: " + count + " satır yüklendi, " + productMap.size() + " ürün.");
    }

    // ─── DS6: Amazon Reviews (marketplace, customer_id, review_id, product_id, product_parent, product_title, product_category, star_rating, ..., review_headline, review_body, review_date) ──

    private void loadDs6(String encodedPassword, Store ukStore) {
        int rowLimit = 3000;
        int count    = 0;
        Map<String, Product> productMap = new HashMap<>();
        Map<String, User>    userMap    = new HashMap<>();

        try (BufferedReader br = new BufferedReader(new InputStreamReader(
                new ClassPathResource("data/ds6.tsv").getInputStream(), "UTF-8"))) {

            br.readLine(); // header

            String line;
            while ((line = br.readLine()) != null && count < rowLimit) {
                String[] cols = line.split("\t", -1);
                if (cols.length < 15) continue;

                String customerId   = cols[1].trim();
                String productId    = cols[3].trim();
                String productTitle = cols[5].trim();
                String productCat   = cols[6].trim();
                String starStr      = cols[7].trim();
                String headline     = cols[12].trim();
                String body         = cols[13].trim();
                String dateStr      = cols[14].trim();

                if (productId.isBlank()) continue;

                String catName = productCat.isEmpty() ? "General" : capitalize(productCat);
                Category category = getOrCreateCategory(catName, null);

                String sku = "DS6-" + productId;
                Product product = productMap.computeIfAbsent(sku, s -> {
                    String name = productTitle.isEmpty() ? productId : productTitle;
                    if (name.length() > 255) name = name.substring(0, 255);
                    Product p = new Product();
                    p.setSku(s);
                    p.setName(name);
                    p.setUnitPrice(BigDecimal.valueOf(29.99));
                    p.setStockQuantity(50);
                    p.setCategory(category);
                    p.setStore(ukStore);
                    return productRepository.save(p);
                });

                String email = "ds6customer" + customerId + "@amazon.us";
                User user = userMap.computeIfAbsent(email, e -> {
                    User u = new User(e, encodedPassword, "INDIVIDUAL", null, "Amazon Customer " + customerId);
                    return userRepository.save(u);
                });

                Review review = new Review();
                review.setProduct(product);
                review.setUser(user);
                try { review.setRating(Integer.parseInt(starStr)); } catch (NumberFormatException ignored) {}
                review.setReviewHeadline(headline.length() > 255 ? headline.substring(0, 255) : headline);
                review.setComment(body.length() > 1000 ? body.substring(0, 1000) : body);
                review.setSentiment(toSentiment(review.getRating()));
                review.setDate(parseLocalDate(dateStr));
                reviewRepository.save(review);

                count++;
            }
        } catch (Exception e) {
            log.warning("DS6 hatası: " + e.getMessage());
        }
        log.info("DS6: " + count + " yorum yüklendi, " + productMap.size() + " ürün.");
    }

    // ─── Yardımcı Metodlar ────────────────────────────────────────────────────

    private Category getOrCreateCategory(String name, Category parent) {
        return categoryRepository.findByName(name).orElseGet(() -> {
            Category c = new Category(name);
            c.setParent(parent);
            return categoryRepository.save(c);
        });
    }

    private String[] splitCsv(String line) {
        List<String> tokens = new ArrayList<>();
        StringBuilder current = new StringBuilder();
        boolean inQuotes = false;
        for (int i = 0; i < line.length(); i++) {
            char c = line.charAt(i);
            if (c == '"') {
                inQuotes = !inQuotes;
            } else if (c == ',' && !inQuotes) {
                tokens.add(current.toString());
                current.setLength(0);
            } else {
                current.append(c);
            }
        }
        tokens.add(current.toString());
        return tokens.toArray(new String[0]);
    }

    private LocalDateTime parseDateTime(String s) {
        if (s == null || s.isBlank()) return LocalDateTime.now();
        try {
            // "2009-12-01 07:45:00"
            return LocalDateTime.parse(s.trim(), DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss"));
        } catch (DateTimeParseException e1) {
            try {
                return LocalDate.parse(s.trim()).atStartOfDay();
            } catch (DateTimeParseException e2) {
                return LocalDateTime.now();
            }
        }
    }

    private LocalDateTime parseDs4Date(String s) {
        if (s == null || s.isBlank()) return LocalDateTime.now();
        try {
            // "04-30-22" → MM-dd-yy
            return LocalDate.parse(s.trim(), DateTimeFormatter.ofPattern("MM-dd-yy")).atStartOfDay();
        } catch (DateTimeParseException e) {
            return LocalDateTime.now();
        }
    }

    private LocalDate parseLocalDate(String s) {
        if (s == null || s.isBlank()) return LocalDate.now();
        try {
            return LocalDate.parse(s.trim());
        } catch (DateTimeParseException e) {
            return LocalDate.now();
        }
    }

    private BigDecimal parseBigDecimal(String s, BigDecimal defaultVal) {
        if (s == null || s.isBlank()) return defaultVal;
        try {
            // Remove currency symbols, spaces, commas inside numbers
            String clean = s.trim().replaceAll("[^0-9.]", "");
            if (clean.isEmpty()) return defaultVal;
            return new BigDecimal(clean);
        } catch (NumberFormatException e) {
            return defaultVal;
        }
    }

    private String mapDs4Status(String raw) {
        if (raw == null) return "PENDING";
        String lower = raw.toLowerCase();
        if (lower.contains("delivered")) return "DELIVERED";
        if (lower.contains("shipped"))   return "SHIPPED";
        if (lower.contains("cancel"))    return "CANCELLED";
        if (lower.contains("pending"))   return "PENDING";
        return "PENDING";
    }

    private String mapDs5Status(String raw) {
        if (raw == null) return "PENDING";
        String lower = raw.toLowerCase();
        if (lower.contains("complete"))  return "DELIVERED";
        if (lower.contains("cancel"))    return "CANCELLED";
        if (lower.contains("process"))   return "SHIPPED";
        if (lower.contains("closed"))    return "DELIVERED";
        return "PENDING";
    }

    private String toSentiment(Integer rating) {
        if (rating == null) return "Neutral";
        if (rating >= 4)    return "Positive";
        if (rating <= 2)    return "Negative";
        return "Neutral";
    }

    private String capitalize(String s) {
        if (s == null || s.isBlank()) return s;
        return s.substring(0, 1).toUpperCase() + s.substring(1).toLowerCase();
    }
}
