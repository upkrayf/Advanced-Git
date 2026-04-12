package com.datapulse.backend.service;

import com.datapulse.backend.entity.*;
import com.datapulse.backend.repository.*;
import com.opencsv.CSVParserBuilder;
import com.opencsv.CSVReader;
import com.opencsv.CSVReaderBuilder;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class EtlService {

    private static final Logger logger = LoggerFactory.getLogger(EtlService.class);

    private final CategoryRepository categoryRepository;
    private final StoreRepository storeRepository;
    private final ProductRepository productRepository;
    private final UserRepository userRepository;
    private final CustomerProfileRepository customerProfileRepository;
    private final OrderRepository orderRepository;
    private final OrderItemRepository orderItemRepository;
    private final ShipmentRepository shipmentRepository;
    private final PaymentRepository paymentRepository;
    private final ReviewRepository reviewRepository;

    @Value("${etl.data-dir:./data}")
    private String dataDir;

    public EtlService(CategoryRepository categoryRepository,
                      StoreRepository storeRepository,
                      ProductRepository productRepository,
                      UserRepository userRepository,
                      CustomerProfileRepository customerProfileRepository,
                      OrderRepository orderRepository,
                      OrderItemRepository orderItemRepository,
                      ShipmentRepository shipmentRepository,
                      PaymentRepository paymentRepository,
                      ReviewRepository reviewRepository) {
        this.categoryRepository = categoryRepository;
        this.storeRepository = storeRepository;
        this.productRepository = productRepository;
        this.userRepository = userRepository;
        this.customerProfileRepository = customerProfileRepository;
        this.orderRepository = orderRepository;
        this.orderItemRepository = orderItemRepository;
        this.shipmentRepository = shipmentRepository;
        this.paymentRepository = paymentRepository;
        this.reviewRepository = reviewRepository;
    }

    public Map<String, Object> loadAllDatasets() {
        Path folder = Paths.get(dataDir);
        if (!Files.exists(folder) || !Files.isDirectory(folder)) {
            Path fallback = Paths.get("src/main/resources/data");
            if (Files.exists(fallback) && Files.isDirectory(fallback)) {
                folder = fallback;
            }
        }

        Map<String, Object> results = new LinkedHashMap<>();

        if (!Files.exists(folder) || !Files.isDirectory(folder)) {
            results.put("status", "missing");
            results.put("message", "ETL data directory not found: " + folder.toAbsolutePath());
            return results;
        }

        List<String> supportedFiles = Arrays.asList("ds1.csv", "ds2.csv", "ds3.csv", "ds4.csv", "ds5.csv", "ds6.tsv");

        for (String fileName : supportedFiles) {
            Path path = folder.resolve(fileName);
            if (Files.exists(path)) {
                try {
                    int processed = processFile(path);
                    results.put(fileName, "processed=" + processed);
                } catch (Exception e) {
                    logger.warn("ETL load failed for {}: {}", fileName, e.getMessage());
                    results.put(fileName, "failed: " + e.getMessage());
                }
            } else {
                results.put(fileName, "skipped (not found)");
            }
        }

        results.put("status", "done");
        results.put("dataDir", folder.toAbsolutePath().toString());
        return results;
    }

    private int processFile(Path path) throws IOException {
        char delimiter = path.toString().toLowerCase().endsWith(".tsv") ? '\t' : ',';
        try (CSVReader reader = new CSVReaderBuilder(Files.newBufferedReader(path, StandardCharsets.UTF_8))
                .withCSVParser(new CSVParserBuilder().withSeparator(delimiter).build())
                .build()) {
            List<String[]> rows = reader.readAll();
            if (rows.isEmpty()) {
                return 0;
            }

            String[] header = rows.get(0);
            Map<String, Integer> columnIndex = createIndexMap(header);
            List<String[]> dataRows = rows.subList(1, rows.size());
            if (looksLikeReviewDataset(columnIndex)) {
                return importReviews(dataRows, columnIndex);
            } else if (looksLikeShipmentDataset(columnIndex)) {
                return importShipments(dataRows, columnIndex);
            } else if (looksLikeProfileDataset(columnIndex)) {
                return importCustomerProfiles(dataRows, columnIndex);
            } else if (looksLikePaymentDataset(columnIndex)) {
                return importPayments(dataRows, columnIndex);
            } else if (looksLikeOrderDataset(columnIndex)) {
                return importOrders(dataRows, columnIndex);
            } else if (looksLikeProductDataset(columnIndex)) {
                return importProducts(dataRows, columnIndex);
            }
            logger.info("ETL skipped unsupported dataset: {}", path.getFileName());
            return 0;
        }
    }

    private Map<String, Integer> createIndexMap(String[] header) {
        Map<String, Integer> indexMap = new HashMap<>();
        for (int i = 0; i < header.length; i++) {
            indexMap.put(header[i].trim().toLowerCase(), i);
        }
        return indexMap;
    }

    private boolean looksLikeReviewDataset(Map<String, Integer> index) {
        return index.containsKey("review") || index.containsKey("rating") || index.containsKey("comment");
    }

    private boolean looksLikeShipmentDataset(Map<String, Integer> index) {
        return index.containsKey("warehouse_block") || index.containsKey("mode_of_shipment") || index.containsKey("product_importance");
    }

    private boolean looksLikeProfileDataset(Map<String, Integer> index) {
        return index.containsKey("age") || index.containsKey("city") || index.containsKey("membership_type") || index.containsKey("gender");
    }

    private boolean looksLikePaymentDataset(Map<String, Integer> index) {
        return index.containsKey("payment_type") || index.containsKey("payment_value") || index.containsKey("grand_total") || index.containsKey("paymentmethod");
    }

    private boolean looksLikeOrderDataset(Map<String, Integer> index) {
        return index.containsKey("invoiceno") || index.containsKey("orderid") || index.containsKey("grandtotal") || index.containsKey("order_number") || index.containsKey("orderstatus");
    }

    private boolean looksLikeProductDataset(Map<String, Integer> index) {
        return index.containsKey("sku") || index.containsKey("product_name") || index.containsKey("unit_price") || index.containsKey("price");
    }

    private int importProducts(List<String[]> rows, Map<String, Integer> index) {
        int count = 0;
        for (String[] row : rows) {
            if (row.length == 0) continue;
            String sku = getValue(row, index, "sku", "productcode", "product id", "productid");
            String name = getValue(row, index, "product_name", "name", "productname");
            String categoryName = getValue(row, index, "category", "category_name", "sub_category");
            String storeName = getValue(row, index, "store", "shop", "marketplace");
            String priceValue = getValue(row, index, "unit_price", "price", "sale_price");
            String stockValue = getValue(row, index, "stock_quantity", "stock", "quantity", "available_stock");
            String description = getValue(row, index, "description", "product_description", "desc");

            if (name == null || name.isBlank()) {
                continue;
            }

            Category category = null;
            if (categoryName != null && !categoryName.isBlank()) {
                category = categoryRepository.findByName(categoryName)
                        .orElseGet(() -> categoryRepository.save(createCategory(categoryName)));
            }

            Store store = null;
            if (storeName != null && !storeName.isBlank()) {
                store = storeRepository.findAll().stream()
                        .filter(s -> storeName.equalsIgnoreCase(s.getName()))
                        .findFirst()
                        .orElseGet(() -> storeRepository.save(createStore(storeName)));
            }

            Product product = null;
            if (sku != null && !sku.isBlank()) {
                product = productRepository.findBySku(sku).orElse(null);
            }
            if (product == null) {
                product = new Product();
                product.setSku(sku);
            }
            product.setName(name);
            product.setDescription(description);
            product.setCategory(category);
            product.setStore(store);
            product.setUnitPrice(parseBigDecimal(priceValue));
            product.setStockQuantity(parseInteger(stockValue));
            productRepository.save(product);
            count++;
        }
        return count;
    }

    private int importCustomerProfiles(List<String[]> rows, Map<String, Integer> index) {
        int count = 0;
        for (String[] row : rows) {
            String email = getValue(row, index, "email", "user_email", "customer_email", "email_address");
            if (email == null || email.isBlank()) {
                continue;
            }
            User user = userRepository.findByEmail(email)
                    .orElseGet(() -> userRepository.save(createUser(email, "INDIVIDUAL")));
            String ageValue = getValue(row, index, "age");
            String city = getValue(row, index, "city", "location", "customer_city");
            String membership = getValue(row, index, "membership_type", "membership", "customer_type");
            String gender = getValue(row, index, "gender");

            CustomerProfile profile = customerProfileRepository.findByUserId(user.getId())
                    .orElseGet(() -> {
                        CustomerProfile p = new CustomerProfile();
                        p.setUser(user);
                        return p;
                    });
            profile.setAge(parseInteger(ageValue));
            profile.setCity(city);
            profile.setMembershipType(membership);
            user.setGender(gender);
            customerProfileRepository.save(profile);
            userRepository.save(user);
            count++;
        }
        return count;
    }

    private int importShipments(List<String[]> rows, Map<String, Integer> index) {
        int count = 0;
        for (String[] row : rows) {
            Shipment shipment = new Shipment();
            shipment.setWarehouseBlock(getValue(row, index, "warehouse_block", "warehouseblock"));
            shipment.setModeOfShipment(getValue(row, index, "mode_of_shipment", "modeofshipment"));
            shipment.setProductImportance(getValue(row, index, "product_importance", "productimportance"));
            shipment.setReachingOnTime(parseInteger(getValue(row, index, "reached_on_time", "reaching_on_time", "reachingontime", "reachedontime")));
            shipmentRepository.save(shipment);
            count++;
        }
        return count;
    }

    private int importOrders(List<String[]> rows, Map<String, Integer> index) {
        int count = 0;
        for (String[] row : rows) {
            String orderNumber = getValue(row, index, "invoiceno", "orderid", "order_number", "invoice_no", "order_no");
            if (orderNumber == null || orderNumber.isBlank()) {
                continue;
            }
            Order order = orderRepository.findByOrderNumber(orderNumber)
                    .orElseGet(() -> {
                        Order newOrder = new Order();
                        newOrder.setOrderNumber(orderNumber);
                        return newOrder;
                    });

            order.setOrderDate(parseDateTime(getValue(row, index, "order_date", "orderdate", "date")).orElse(LocalDateTime.now()));
            order.setGrandTotal(parseBigDecimal(getValue(row, index, "grandtotal", "grand_total", "total", "amount")));
            String status = getValue(row, index, "status", "orderstatus", "order_status");
            if (status != null) {
                order.setStatus(status);
            }
            String email = getValue(row, index, "customer_email", "email", "user_email");
            if (email != null && !email.isBlank()) {
                User user = userRepository.findByEmail(email).orElseGet(() -> userRepository.save(createUser(email, "INDIVIDUAL")));
                order.setUser(user);
            }
            orderRepository.save(order);
            count++;
        }
        return count;
    }

    private int importPayments(List<String[]> rows, Map<String, Integer> index) {
        int count = 0;
        for (String[] row : rows) {
            String orderNumber = getValue(row, index, "invoice_no", "orderid", "order_number", "orderid");
            if (orderNumber == null || orderNumber.isBlank()) {
                continue;
            }
            Order order = orderRepository.findByOrderNumber(orderNumber).orElse(null);
            if (order == null) {
                continue;
            }
            Payment payment = new Payment();
            payment.setOrder(order);
            payment.setPaymentType(getValue(row, index, "payment_type", "paymentmethod", "payment_method"));
            payment.setPaymentValue(parseBigDecimal(getValue(row, index, "payment_value", "payment_amount", "amount", "grand_total")));
            paymentRepository.save(payment);
            count++;
        }
        return count;
    }

    private int importReviews(List<String[]> rows, Map<String, Integer> index) {
        int count = 0;
        for (String[] row : rows) {
            String productSku = getValue(row, index, "sku", "product_id", "product_sku");
            String ratingValue = getValue(row, index, "rating", "review_score", "stars");
            String comment = getValue(row, index, "review", "comment", "feedback");
            String sentiment = getValue(row, index, "sentiment");
            String reviewDate = getValue(row, index, "review_date", "date", "timestamp");

            Product product = null;
            if (productSku != null && !productSku.isBlank()) {
                product = productRepository.findBySku(productSku).orElse(null);
            }
            if (product == null && comment != null && !comment.isBlank()) {
                product = productRepository.findAll().stream().findFirst().orElse(null);
            }
            if (product == null) {
                continue;
            }
            Review review = new Review();
            review.setProduct(product);
            review.setRating(parseInteger(ratingValue));
            review.setComment(comment);
            review.setSentiment(sentiment);
            parseDate(reviewDate).ifPresent(review::setDate);
            reviewRepository.save(review);
            count++;
        }
        return count;
    }

    private String getValue(String[] row, Map<String, Integer> index, String... possibleKeys) {
        for (String key : possibleKeys) {
            Integer idx = index.get(key.trim().toLowerCase());
            if (idx != null && idx < row.length) {
                String value = row[idx];
                if (value != null && !value.isBlank()) {
                    return value.trim();
                }
            }
        }
        return null;
    }

    private Category createCategory(String name) {
        Category category = new Category();
        category.setName(name);
        return category;
    }

    private Store createStore(String name) {
        Store store = new Store();
        store.setName(name);
        store.setStatus("ACTIVE");
        return store;
    }

    private User createUser(String email, String role) {
        User user = new User();
        user.setEmail(email);
        user.setPasswordHash("[ETL_IMPORT]");
        user.setRoleType(role);
        return user;
    }

    private BigDecimal parseBigDecimal(String raw) {
        if (raw == null || raw.isBlank()) {
            return BigDecimal.ZERO;
        }
        try {
            return new BigDecimal(raw.replaceAll("[^0-9.,-]", "").replace(',', '.'));
        } catch (NumberFormatException e) {
            return BigDecimal.ZERO;
        }
    }

    private Integer parseInteger(String raw) {
        if (raw == null || raw.isBlank()) {
            return null;
        }
        try {
            return Integer.parseInt(raw.replaceAll("[^0-9-]", ""));
        } catch (NumberFormatException e) {
            return null;
        }
    }

    private Optional<LocalDateTime> parseDateTime(String raw) {
        if (raw == null || raw.isBlank()) {
            return Optional.empty();
        }
        try {
            return Optional.of(LocalDateTime.parse(raw, DateTimeFormatter.ISO_DATE_TIME));
        } catch (Exception ignored) {
        }
        try {
            return Optional.of(LocalDateTime.parse(raw, DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss")));
        } catch (Exception ignored) {
        }
        try {
            return Optional.of(LocalDate.parse(raw, DateTimeFormatter.ISO_DATE).atStartOfDay());
        } catch (Exception ignored) {
        }
        return Optional.of(LocalDateTime.now());
    }

    private Optional<LocalDate> parseDate(String raw) {
        if (raw == null || raw.isBlank()) {
            return Optional.empty();
        }
        try {
            return Optional.of(LocalDate.parse(raw, DateTimeFormatter.ISO_DATE));
        } catch (Exception ignored) {
        }
        try {
            return Optional.of(LocalDate.parse(raw, DateTimeFormatter.ofPattern("yyyy-MM-dd")));
        } catch (Exception ignored) {
        }
        return Optional.empty();
    }
}
