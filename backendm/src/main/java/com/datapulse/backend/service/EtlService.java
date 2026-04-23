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
    private final Random random = new Random();

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

        // 1. Root Entities
        log.info("DS2: Ana Kullanıcılar Yükleniyor... (Max 350)");
        List<User> allUsers = new ArrayList<>(loadUsersDs2(encodedPassword));
        allUsers.addAll(Arrays.asList(ukCorp, indiaCorp, pakCorp));

        log.info("DS1, DS4, DS5: Ana Ürünler Yükleniyor... (Max 500)");
        List<Product> allProducts = loadProducts(ukStore, indiaStore, pakStore);

        // 2. Transactional Data
        log.info("DS5: Siparişler Yükleniyor... (Max 1000)");
        List<Order> allOrders = loadOrders(allUsers, allProducts);

        log.info("DS3, DS4: Kargo Bilgileri Yükleniyor... (Max 1000)");
        loadShipments(allOrders);

        log.info("DS6: Yorumlar Yükleniyor... (Max 1000)");
        loadReviews(allUsers, allProducts);

        log.info("ETL tamamlandı.");
    }

    private void clearAll() {
        refreshTokenRepository.deleteAllInBatch();     
        reviewRepository.deleteAllInBatch();           
        paymentRepository.deleteAllInBatch();          
        orderItemRepository.deleteAllInBatch();        
        orderRepository.deleteAllInBatch();            
        shipmentRepository.deleteAllInBatch();         
        customerProfileRepository.deleteAllInBatch();  
        productRepository.deleteAllInBatch();          
        storeRepository.deleteAllInBatch();            
        categoryRepository.deleteAllInBatch();         
        userRepository.deleteAllInBatch();             
    }

    private Map<String, Object[]> createSystemSetup(String encodedPassword) {
        User admin = userRepository.save(new User("admin@datapulse.com", encodedPassword, "ADMIN", null, "Platform Admin"));
        User ukCorp    = userRepository.save(new User("uk@datapulse.com",       encodedPassword, "CORPORATE", null, "UK Retail Manager"));
        User indiaCorp = userRepository.save(new User("india@datapulse.com",    encodedPassword, "CORPORATE", null, "India Amazon Manager"));
        User pakCorp   = userRepository.save(new User("pakistan@datapulse.com", encodedPassword, "CORPORATE", null, "Pakistan E-Commerce Manager"));

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

    private List<User> loadUsersDs2(String encodedPassword) {
        List<User> users = new ArrayList<>();
        int count = 0;
        int rowLimit = 350;

        try (BufferedReader br = new BufferedReader(new InputStreamReader(
                new ClassPathResource("data/ds2.csv").getInputStream(), "UTF-8"))) {
            String line = br.readLine();
            while ((line = br.readLine()) != null && count < rowLimit) {
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

                String email = "user_" + customerId + "@datapulse.com";
                User user = new User(email, encodedPassword, "INDIVIDUAL",
                        gender.isEmpty() ? null : gender, "Customer " + customerId);
                user = userRepository.save(user);

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

                users.add(user);
                count++;
            }
        } catch (Exception e) {
             log.warning("DS2 hatası: " + e.getMessage());
        }
        return users;
    }

    private List<Product> loadProducts(Store ukStore, Store indiaStore, Store pakStore) {
        List<Product> products = new ArrayList<>();
        List<String> realCategories = extractRealCategories();
        if (realCategories.isEmpty()) realCategories = Arrays.asList("General");
        
        Store[] stores = {ukStore, indiaStore, pakStore};
        Set<String> seenSkus = new HashSet<>();
        int count = 0;
        int rowLimit = 500;

        try (BufferedReader br = new BufferedReader(new InputStreamReader(
                new ClassPathResource("data/ds1.csv").getInputStream(), "UTF-8"))) {
            String line = br.readLine();
            while ((line = br.readLine()) != null && count < rowLimit) {
                String[] cols = splitCsv(line);
                if (cols.length < 7) continue;

                String stockCode  = cols[1].trim();
                String desc       = cols[2].trim();
                String priceStr   = cols[5].trim();

                if (stockCode.isBlank() || desc.isBlank() || !seenSkus.add(stockCode)) continue;
                if (desc.trim().toLowerCase().startsWith("amazon")) continue; 

                BigDecimal price;
                try {
                    price = new BigDecimal(priceStr);
                } catch (NumberFormatException e) { continue; }
                if (price.compareTo(BigDecimal.ZERO) <= 0) continue;

                String name = desc.length() > 255 ? desc.substring(0, 255) : desc;
                
                Product p = new Product();
                p.setSku(stockCode);
                p.setName(name);
                p.setDescription("Bu harika ürün (" + name.toLowerCase() + "), yüksek kalite standartlarında üretilmiştir. " +
                                 "Günlük kullanım için idealdir ve uzun ömürlü dayanıklılık sunar. Hemen sipariş vererek " +
                                 "DataPulse ayrıcalıklarından faydalanabilirsiniz.");
                p.setUnitPrice(price);
                p.setCost(price.multiply(BigDecimal.valueOf(0.6))); // Sentetik Cost
                p.setStockQuantity(100 + random.nextInt(900));
                String pCatName = realCategories.get(count % realCategories.size());
                p.setCategory(getOrCreateCategory(pCatName, null));
                p.setStore(stores[count % stores.length]);
                products.add(productRepository.save(p));

                count++;
            }
        } catch (Exception e) {
            log.warning("DS1 Ürün hatası: " + e.getMessage());
        }
        return products;
    }

    private List<Order> loadOrders(List<User> users, List<Product> products) {
        List<Order> orders = new ArrayList<>();
        int count = 0;
        int rowLimit = 1000;

        if (users.isEmpty() || products.isEmpty()) return orders;

        Set<String> seenOrders = new HashSet<>();
        String[] fallbackPayments = {"Credit Card", "PayPal", "Bank Transfer", "Cash on Delivery"};

        try (BufferedReader br = new BufferedReader(new InputStreamReader(
                new ClassPathResource("data/ds5.csv").getInputStream(), "UTF-8"))) {
            br.readLine();
            String line;
            while ((line = br.readLine()) != null && count < rowLimit) {
                String[] cols = splitCsv(line);
                if (cols.length < 12) continue;

                String statusRaw    = cols[1].trim();
                String qtyStr       = cols[5].trim();
                String totalAmountStr= cols[6].trim();
                String orderNum     = cols[7].trim();
                String paymentMethod= cols[11].trim();

                if (orderNum.isBlank() || !seenOrders.add(orderNum)) continue;

                int qty = 1;
                try { qty = (int) Double.parseDouble(qtyStr); } catch (NumberFormatException ignored) {}
                if (qty <= 0) qty = 1;

                Product product = products.get(count % products.size());
                User user = users.get(count % users.size());

                BigDecimal totalAmountVal = parseBigDecimal(totalAmountStr, product.getUnitPrice().multiply(BigDecimal.valueOf(qty)));

                Order o = new Order();
                o.setOrderNumber(orderNum);
                o.setOrderDate(LocalDateTime.now().minusDays(random.nextInt(730)));
                o.setStatus(mapOrderStatus(statusRaw));
                o.setTotalAmount(totalAmountVal);
                o.setUser(user);
                Order saved = orderRepository.save(o);

                if (paymentMethod.isBlank()) paymentMethod = fallbackPayments[count % fallbackPayments.length];
                
                Payment payment = new Payment();
                payment.setOrder(saved);
                payment.setPaymentType(paymentMethod);
                payment.setAmount(totalAmountVal);
                paymentRepository.save(payment);

                OrderItem item = new OrderItem();
                item.setOrder(saved);
                item.setProduct(product);
                item.setQuantity(qty);
                item.setPrice(product.getUnitPrice());
                item = orderItemRepository.save(item);

                saved.setPayments(new ArrayList<>(List.of(payment)));
                saved.setItems(new ArrayList<>(List.of(item)));
                saved = orderRepository.save(saved);

                orders.add(saved);
                count++;
            }
        } catch (Exception e) {
            log.warning("DS5 Sipariş hatası: " + e.getMessage());
        }
        return orders;
    }

    private void loadShipments(List<Order> orders) {
        int count = 0;
        int rowLimit = Math.min(1000, orders.size());

        if (orders.isEmpty()) return;

        try (BufferedReader br = new BufferedReader(new InputStreamReader(
                new ClassPathResource("data/ds3.csv").getInputStream(), "UTF-8"))) {
            String headerLine = br.readLine();
            if (headerLine != null && headerLine.startsWith("﻿")) headerLine = headerLine.substring(1);

            String line;
            while ((line = br.readLine()) != null && count < rowLimit) {
                String[] cols = splitCsv(line);
                if (cols.length < 12) continue;

                String warehouse     = cols[1].trim();
                String shipMode      = cols[2].trim();
                String ratingStr     = cols[4].trim();
                String importance    = cols[7].trim();
                String discountStr   = cols[9].trim();
                String weightStr     = cols[10].trim();
                String onTimeStr     = cols[11].trim();

                Shipment shipment = new Shipment();
                shipment.setWarehouseBlock(warehouse.isEmpty() ? null : warehouse);
                shipment.setModeOfShipment(shipMode.isEmpty() ? null : shipMode);
                try { shipment.setCustomerRating(Integer.parseInt(ratingStr)); } catch (NumberFormatException ignored) {}
                try { shipment.setDiscountOffered(Integer.parseInt(discountStr)); } catch (NumberFormatException ignored) {}
                try { shipment.setWeightInGms(Integer.parseInt(weightStr)); } catch (NumberFormatException ignored) {}
                try { shipment.setReachingOnTime(Integer.parseInt(onTimeStr)); } catch (NumberFormatException ignored) {}
                shipment.setProductImportance(importance.isEmpty() ? null : importance);
                
                // DS4'ten sentetik Service Level bağla
                shipment.setServiceLevel(random.nextBoolean() ? "Expedited" : "Standard");
                
                shipment = shipmentRepository.save(shipment);

                // İlişkilendir
                Order order = orders.get(count);
                order.setShipment(shipment);
                if (shipment.getReachingOnTime() != null && shipment.getReachingOnTime() == 1) {
                    order.setStatus("DELIVERED");
                }
                orderRepository.save(order);

                count++;
            }
        } catch (Exception e) {
            log.warning("DS3 Kargo hatası: " + e.getMessage());
        }
    }

    private void loadReviews(List<User> users, List<Product> products) {
        int count = 0;
        int rowLimit = 1000;

        if (users.isEmpty() || products.isEmpty()) return;

        try (BufferedReader br = new BufferedReader(new InputStreamReader(
                new ClassPathResource("data/ds6.tsv").getInputStream(), "UTF-8"))) {
            br.readLine();
            String line;
            while ((line = br.readLine()) != null && count < rowLimit) {
                String[] cols = line.split("\t", -1);
                if (cols.length < 15) continue;

                String starStr      = cols[7].trim();
                String headline     = cols[12].trim();
                String body         = cols[13].trim();
                String dateStr      = cols[14].trim();

                Product product = products.get(count % products.size());
                User user = users.get(count % users.size());

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
            log.warning("DS6 Yorum hatası: " + e.getMessage());
        }
    }

    private List<String> extractRealCategories() {
        Set<String> uniqueCats = new HashSet<>();
        try (BufferedReader br = new BufferedReader(new InputStreamReader(
                new ClassPathResource("data/ds5.csv").getInputStream(), "UTF-8"))) {
            br.readLine();
            for (int i=0; i<3000; i++) {
                String line = br.readLine();
                if (line == null) break;
                String[] cols = splitCsv(line);
                if (cols.length >= 9) {
                    String cat = cols[8].trim();
                    if (!cat.isBlank() && !cat.equalsIgnoreCase("None")) uniqueCats.add(capitalize(cat));
                }
            }
        } catch (Exception e) {}
        
        try (BufferedReader br = new BufferedReader(new InputStreamReader(
                new ClassPathResource("data/ds6.tsv").getInputStream(), "UTF-8"))) {
            br.readLine();
            for (int i=0; i<3000; i++) {
                String line = br.readLine();
                if (line == null) break;
                String[] cols = line.split("\t", -1);
                if (cols.length >= 7) {
                    String cat = cols[6].trim();
                    if (!cat.isBlank() && !cat.equalsIgnoreCase("None")) uniqueCats.add(capitalize(cat));
                }
            }
        } catch (Exception e) {}
        
        return new ArrayList<>(uniqueCats);
    }

    private String capitalize(String str) {
        if (str == null || str.isEmpty()) return str;
        return str.substring(0, 1).toUpperCase() + str.substring(1).toLowerCase();
    }

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

    private LocalDate parseLocalDate(String s) {
        if (s == null || s.isBlank()) return LocalDate.now();
        try { return LocalDate.parse(s.trim()); } catch (DateTimeParseException e) { return LocalDate.now(); }
    }

    private BigDecimal parseBigDecimal(String s, BigDecimal defaultVal) {
        if (s == null || s.isBlank()) return defaultVal;
        try {
            String clean = s.trim().replaceAll("[^0-9.]", "");
            if (clean.isEmpty()) return defaultVal;
            return new BigDecimal(clean);
        } catch (NumberFormatException e) { return defaultVal; }
    }

    private String mapOrderStatus(String raw) {
        if (raw == null) return "PENDING";
        String lower = raw.toLowerCase();
        if (lower.contains("complete") || lower.contains("delivered"))  return "DELIVERED";
        if (lower.contains("cancel"))    return "CANCELLED";
        if (lower.contains("process") || lower.contains("shipped"))   return "SHIPPED";
        return "PENDING";
    }

    private String toSentiment(Integer rating) {
        if (rating == null) return "Neutral";
        if (rating >= 4) return "Positive";
        if (rating <= 2) return "Negative";
        return "Neutral";
    }
}
