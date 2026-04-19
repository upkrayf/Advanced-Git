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
import java.time.format.DateTimeParseException;

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

    // -------------------------------------------------------------------------
    // DS1: Online Retail (Invoice, StockCode, Description, Quantity, InvoiceDate,
    //      Price, Customer ID, Country)
    // -------------------------------------------------------------------------
    private void loadDs1() throws Exception {
        String file = "src/main/resources/data/ds1.csv";
        System.out.println("Loading " + file);
        DateTimeFormatter dt1 = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");
        try (CSVReader reader = new CSVReader(new FileReader(file))) {
            reader.readNext(); // skip header
            String[] line;
            int count = 0;
            while ((line = reader.readNext()) != null && count < 1000) {
                if (line.length < 8) continue;
                // col[0]=Invoice, col[1]=StockCode, col[2]=Description,
                // col[3]=Quantity, col[4]=InvoiceDate, col[5]=Price,
                // col[6]=Customer ID, col[7]=Country
                String invoice      = line[0].trim();
                String stockCode    = line[1].trim();
                String description  = line[2].trim();
                String quantityStr  = line[3].trim();
                String invoiceDate  = line[4].trim();
                String priceStr     = line[5].trim();
                String customerId   = line[6].trim();
                String country      = line[7].trim();

                if (customerId.isEmpty()) continue;
                if (stockCode.isEmpty() || description.isEmpty()) continue;
                if (priceStr.isEmpty() || quantityStr.isEmpty()) continue;

                double price;
                try { price = Double.parseDouble(priceStr); } catch (NumberFormatException e) { continue; }
                if (price <= 0) continue;

                int qty;
                try { qty = (int) Math.abs(Double.parseDouble(quantityStr)); } catch (NumberFormatException e) { continue; }
                if (qty <= 0) continue;

                // Parse InvoiceDate → orderDate
                LocalDateTime orderDate = LocalDateTime.now();
                try { orderDate = LocalDateTime.parse(invoiceDate, dt1); } catch (DateTimeParseException ignored) {}

                // --- User ---
                String email = "ds1_" + customerId.replace(".0", "") + "@dummy.com";
                User user = userRepository.findByEmail(email).orElse(null);
                if (user == null) {
                    user = new User(email, "123", "INDIVIDUAL", null);
                    user = userRepository.save(user);
                }

                // --- Category ---
                Category category = findOrCreateCategory("General");

                // --- Product ---
                Product product = productRepository.findBySku(stockCode).orElse(null);
                if (product == null) {
                    product = new Product();
                    product.setSku(stockCode);
                    product.setName(description.isEmpty() ? "Product " + stockCode : description);
                    product.setDescription("From DS1 - " + country);
                    product.setUnitPrice(new BigDecimal(priceStr));
                    product.setStockQuantity(100);
                    product.setCategory(category);
                    product = productRepository.save(product);
                }

                // --- Order ---
                Order order = orderRepository.findByOrderNumber(invoice).orElse(null);
                if (order == null) {
                    order = new Order();
                    order.setOrderNumber(invoice);
                    order.setUser(user);
                    order.setGrandTotal(BigDecimal.ZERO);
                    order.setStatus("COMPLETED");
                    order.setOrderDate(orderDate); // << Gerçek tarih
                    order = orderRepository.save(order);
                }

                // --- OrderItem ---
                OrderItem item = new OrderItem();
                item.setOrder(order);
                item.setProduct(product);
                item.setQuantity(qty);
                item.setPrice(product.getUnitPrice());
                orderItemRepository.save(item);

                // --- Update Order Total ---
                BigDecimal addTotal = product.getUnitPrice().multiply(new BigDecimal(qty));
                order.setGrandTotal(order.getGrandTotal().add(addTotal));
                orderRepository.save(order);

                count++;
            }
        }
        System.out.println("DS1 loaded.");
    }

    // -------------------------------------------------------------------------
    // DS2: Customer Behavior
    // col[0]=Customer ID, col[1]=Gender, col[2]=Age, col[3]=City,
    // col[4]=Membership Type, col[5]=Total Spend, col[6]=Items Purchased,
    // col[7]=Average Rating, col[8]=Discount Applied, col[9]=Days Since Last Purchase,
    // col[10]=Satisfaction Level
    // -------------------------------------------------------------------------
    private void loadDs2() throws Exception {
        String file = "src/main/resources/data/ds2.csv";
        System.out.println("Loading " + file);
        try (CSVReader reader = new CSVReader(new FileReader(file))) {
            reader.readNext(); // skip header
            String[] line;
            int count = 0;
            while ((line = reader.readNext()) != null && count < 1000) {
                if (line.length < 11) continue;
                String customerId   = safe(line[0]);
                String gender       = safe(line[1]);  // Male / Female
                String ageStr       = safe(line[2]);
                String city         = safe(line[3]);
                String membership   = safe(line[4]);
                String totalSpendS  = safe(line[5]);
                String itemsPurchS  = safe(line[6]);
                String avgRatingS   = safe(line[7]);
                String discountS    = safe(line[8]);  // TRUE / FALSE
                String daysSinceS   = safe(line[9]);
                String satisfaction = safe(line[10]);

                if (customerId.isEmpty()) continue;

                String email = "ds2_" + customerId + "@dummy.com";
                User user = userRepository.findByEmail(email).orElse(null);
                if (user == null) {
                    user = new User(email, "hashed_password", "INDIVIDUAL", gender);
                    user = userRepository.save(user);
                } else {
                    // Güncelle: gender boşsa doldur
                    if ((user.getGender() == null || user.getGender().isEmpty()) && !gender.isEmpty()) {
                        user.setGender(gender);
                        userRepository.save(user);
                    }
                }

                if (user.getProfile() == null) {
                    CustomerProfile profile = new CustomerProfile();
                    profile.setUser(user);
                    if (!ageStr.isEmpty()) {
                        try { profile.setAge(Integer.parseInt(ageStr)); } catch (NumberFormatException ignored) {}
                    }
                    profile.setCity(city);
                    profile.setMembershipType(membership);
                    if (!totalSpendS.isEmpty()) {
                        try { profile.setTotalSpend(Double.parseDouble(totalSpendS)); } catch (NumberFormatException ignored) {}
                    }
                    if (!itemsPurchS.isEmpty()) {
                        try { profile.setItemsPurchased(Integer.parseInt(itemsPurchS)); } catch (NumberFormatException ignored) {}
                    }
                    if (!avgRatingS.isEmpty()) {
                        try { profile.setAverageRating(Double.parseDouble(avgRatingS)); } catch (NumberFormatException ignored) {}
                    }
                    if (!discountS.isEmpty()) {
                        profile.setDiscountApplied("TRUE".equalsIgnoreCase(discountS));
                    }
                    if (!daysSinceS.isEmpty()) {
                        try { profile.setDaysSinceLastPurchase(Integer.parseInt(daysSinceS)); } catch (NumberFormatException ignored) {}
                    }
                    profile.setSatisfactionLevel(satisfaction);
                    customerProfileRepository.save(profile);
                    user.setProfile(profile);
                    userRepository.save(user);
                }
                count++;
            }
        }
        System.out.println("DS2 loaded.");
    }

    // -------------------------------------------------------------------------
    // DS3: E-Commerce Shipping
    // col[0]=ID, col[1]=Warehouse_block, col[2]=Mode_of_Shipment,
    // col[3]=Customer_care_calls, col[4]=Customer_rating, col[5]=Cost_of_the_Product,
    // col[6]=Prior_purchases, col[7]=Product_importance, col[8]=Gender,
    // col[9]=Discount_offered, col[10]=Weight_in_gms, col[11]=Reached.on.Time_Y.N
    // -------------------------------------------------------------------------
    private void loadDs3() throws Exception {
        String file = "src/main/resources/data/ds3.csv";
        System.out.println("Loading " + file);
        try (CSVReader reader = new CSVReader(new FileReader(file))) {
            reader.readNext(); // skip header
            String[] line;
            int count = 0;
            while ((line = reader.readNext()) != null && count < 1000) {
                if (line.length < 12) continue;
                // col[1]=Warehouse_block, col[2]=Mode_of_Shipment,
                // col[4]=Customer_rating, col[7]=Product_importance,
                // col[8]=Gender, col[9]=Discount_offered, col[10]=Weight_in_gms,
                // col[11]=Reached.on.Time_Y.N
                String warehouseBlock     = safe(line[1]);
                String modeOfShipment     = safe(line[2]);
                String customerRatingStr  = safe(line[4]);
                String productImportance  = safe(line[7]); // col[7] = Product_importance (low/medium/high)
                String genderCode         = safe(line[8]); // M / F
                String discountStr        = safe(line[9]);
                String weightStr          = safe(line[10]);
                String reachedOnTimeStr   = safe(line[11]);

                // M → Male, F → Female
                String gender = "M".equalsIgnoreCase(genderCode) ? "Male"
                              : "F".equalsIgnoreCase(genderCode) ? "Female" : null;

                Shipment shipment = new Shipment();
                shipment.setWarehouseBlock(warehouseBlock);
                shipment.setModeOfShipment(modeOfShipment);
                shipment.setProductImportance(productImportance);
                if (!reachedOnTimeStr.isEmpty()) {
                    try { shipment.setReachingOnTime(Integer.parseInt(reachedOnTimeStr)); } catch (NumberFormatException ignored) {}
                }
                if (!discountStr.isEmpty()) {
                    try { shipment.setDiscountOffered(Integer.parseInt(discountStr)); } catch (NumberFormatException ignored) {}
                }
                if (!weightStr.isEmpty()) {
                    try { shipment.setWeightInGms(Integer.parseInt(weightStr)); } catch (NumberFormatException ignored) {}
                }
                if (!customerRatingStr.isEmpty()) {
                    try { shipment.setCustomerRating(Integer.parseInt(customerRatingStr)); } catch (NumberFormatException ignored) {}
                }
                shipment = shipmentRepository.save(shipment);

                // Create a DS3 dummy user with gender info
                String ds3Email = "ds3_user_" + count + "@dummy.com";
                User user = new User(ds3Email, "hashed_password", "INDIVIDUAL", gender);
                user = userRepository.save(user);

                // Attach to a dummy order
                Order order = new Order();
                order.setOrderNumber("DS3_" + count);
                order.setGrandTotal(BigDecimal.ZERO);
                order.setStatus("SHIPPED");
                order.setOrderDate(LocalDateTime.now());
                order.setShipment(shipment);
                order.setUser(user);
                orderRepository.save(order);

                count++;
            }
        }
        System.out.println("DS3 loaded.");
    }

    // -------------------------------------------------------------------------
    // DS4: Amazon Sales India
    // col[0]=index, col[1]=Order ID, col[2]=Date, col[3]=Status,
    // col[4]=Fulfilment, col[5]=Sales Channel, col[6]=ship-service-level,
    // col[7]=Style, col[8]=SKU, col[9]=Category, col[10]=Size,
    // col[11]=ASIN, col[12]=Courier Status, col[13]=Qty, col[14]=currency,
    // col[15]=Amount, col[16]=ship-city, col[17]=ship-state, col[18]=ship-postal-code,
    // col[19]=ship-country, col[20]=promotion-ids, col[21]=B2B, col[22]=fulfilled-by
    // -------------------------------------------------------------------------
    private void loadDs4() throws Exception {
        String file = "src/main/resources/data/ds4.csv";
        System.out.println("Loading " + file);
        DateTimeFormatter dt4 = DateTimeFormatter.ofPattern("MM-dd-yy");
        try (CSVReader reader = new CSVReader(new FileReader(file))) {
            reader.readNext(); // skip header
            String[] line;
            int count = 0;
            while ((line = reader.readNext()) != null && count < 1000) {
                if (line.length < 16) continue;
                String orderId    = safe(line[1]);  // Order ID
                String dateStr    = safe(line[2]);  // Date (MM-dd-yy)
                String status     = safe(line[3]);  // Status
                String sku        = safe(line[8]);  // SKU
                String categoryStr= safe(line[9]);  // Category
                String qtyStr     = safe(line[13]); // Qty
                String amountStr  = safe(line[15]); // Amount

                if (sku.isEmpty() || orderId.isEmpty()) continue;

                // Parse date
                LocalDateTime orderDate = LocalDateTime.now();
                if (!dateStr.isEmpty()) {
                    try { orderDate = LocalDate.parse(dateStr, dt4).atStartOfDay(); }
                    catch (DateTimeParseException ignored) {}
                }

                Category category = findOrCreateCategory(categoryStr.isEmpty() ? "Uncategorized" : categoryStr);

                Product product = productRepository.findBySku(sku).orElse(null);
                if (product == null) {
                    product = new Product();
                    product.setSku(sku);
                    product.setName("Amazon Product " + sku);
                    double amount = amountStr.isEmpty() ? 0.0 : parseDouble(amountStr);
                    int qty = qtyStr.isEmpty() ? 1 : parseInt(qtyStr, 1);
                    double unitPrice = qty > 0 ? amount / qty : amount;
                    product.setUnitPrice(new BigDecimal(String.valueOf(unitPrice)));
                    product.setStockQuantity(100);
                    product.setCategory(category);
                    product = productRepository.save(product);
                }

                Order order = orderRepository.findByOrderNumber(orderId).orElse(null);
                if (order == null) {
                    order = new Order();
                    order.setOrderNumber(orderId);
                    order.setGrandTotal(BigDecimal.ZERO);
                    order.setStatus(status.isEmpty() ? "UNKNOWN" : status);
                    order.setOrderDate(orderDate); // << Gerçek tarih
                    order = orderRepository.save(order);
                }

                int qty = qtyStr.isEmpty() ? 1 : parseInt(qtyStr, 1);
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
        System.out.println("DS4 loaded.");
    }

    // -------------------------------------------------------------------------
    // DS5: Pakistani E-Commerce
    // col[0]=item_id, col[1]=status, col[2]=created_at, col[3]=sku,
    // col[4]=price, col[5]=qty_ordered, col[6]=grand_total,
    // col[7]=increment_id (order_id), col[8]=category_name_1,
    // col[9]=sales_commission_code, col[10]=discount_amount,
    // col[11]=payment_method, col[12]=Working_Date, col[13]=BI_Status,
    // col[14]=MV, col[15]=Year, col[16]=Month, col[17]=Customer_Since,
    // col[18]=M-Y, col[19]=FY, col[20]=Customer_ID
    // -------------------------------------------------------------------------
    private void loadDs5() throws Exception {
        String file = "src/main/resources/data/ds5.csv";
        System.out.println("Loading " + file);
        DateTimeFormatter dt5 = DateTimeFormatter.ofPattern("M/d/yyyy");
        try (CSVReader reader = new CSVReader(new FileReader(file))) {
            reader.readNext(); // skip header
            String[] line;
            int count = 0;
            while ((line = reader.readNext()) != null && count < 1000) {
                if (line.length < 12) continue;
                String status         = safe(line[1]);
                String createdAt      = safe(line[2]);  // created_at date
                String sku            = safe(line[3]);
                String priceStr       = safe(line[4]);
                String qtyStr         = safe(line[5]);
                String grandTotalStr  = safe(line[6]);
                String incrementId    = safe(line[7]);  // Order ID
                String categoryStr    = safe(line[8]);
                String paymentMethod  = safe(line[11]);
                String customerId     = line.length > 20 ? safe(line[20]) : ""; // Customer ID

                if (sku.isEmpty() || incrementId.isEmpty()) continue;

                // Parse created_at date
                LocalDateTime orderDate = LocalDateTime.now();
                if (!createdAt.isEmpty()) {
                    try { orderDate = LocalDate.parse(createdAt, dt5).atStartOfDay(); }
                    catch (DateTimeParseException ignored) {}
                }

                // Customer user
                User user = null;
                if (!customerId.isEmpty() && !customerId.equals("\\N")) {
                    String email = "ds5_" + customerId + "@dummy.com";
                    user = userRepository.findByEmail(email).orElse(null);
                    if (user == null) {
                        user = new User(email, "hashed_password", "INDIVIDUAL", null);
                        user = userRepository.save(user);
                    }
                }

                Category category = findOrCreateCategory(categoryStr.isEmpty() ? "Uncategorized" : categoryStr);

                Product product = productRepository.findBySku(sku).orElse(null);
                if (product == null) {
                    product = new Product();
                    product.setSku(sku);
                    product.setName("Pakistani Product " + sku);
                    double price = priceStr.isEmpty() ? 0.0 : parseDouble(priceStr);
                    product.setUnitPrice(new BigDecimal(String.valueOf(price)));
                    product.setStockQuantity(100);
                    product.setCategory(category);
                    product = productRepository.save(product);
                }

                Order order = orderRepository.findByOrderNumber(incrementId).orElse(null);
                if (order == null) {
                    order = new Order();
                    order.setOrderNumber(incrementId);
                    double grandTotal = grandTotalStr.isEmpty() ? 0.0 : parseDouble(grandTotalStr);
                    order.setGrandTotal(new BigDecimal(String.valueOf(grandTotal)));
                    order.setStatus(status.isEmpty() ? "UNKNOWN" : status);
                    order.setOrderDate(orderDate); // << Gerçek tarih
                    if (user != null) order.setUser(user);
                    order = orderRepository.save(order);

                    // Payment
                    if (!paymentMethod.isEmpty() && !paymentMethod.equals("\\N")) {
                        Payment payment = new Payment();
                        payment.setPaymentValue(order.getGrandTotal());
                        payment.setPaymentType(paymentMethod);
                        payment.setOrder(order);
                        paymentRepository.save(payment);
                    }
                }

                int qty = qtyStr.isEmpty() ? 1 : (int) Math.round(parseDouble(qtyStr));
                if (qty <= 0) qty = 1;
                OrderItem item = new OrderItem();
                item.setOrder(order);
                item.setProduct(product);
                item.setQuantity(qty);
                item.setPrice(product.getUnitPrice());
                orderItemRepository.save(item);

                count++;
            }
        }
        System.out.println("DS5 loaded.");
    }

    // -------------------------------------------------------------------------
    // DS6: Amazon Product Reviews (TSV)
    // col[0]=marketplace, col[1]=customer_id, col[2]=review_id,
    // col[3]=product_id, col[4]=product_parent, col[5]=product_title,
    // col[6]=product_category, col[7]=star_rating, col[8]=helpful_votes,
    // col[9]=total_votes, col[10]=vine, col[11]=verified_purchase,
    // col[12]=review_headline, col[13]=review_body, col[14]=review_date
    // -------------------------------------------------------------------------
    private void loadDs6() throws Exception {
        String file = "src/main/resources/data/ds6.tsv";
        System.out.println("Loading " + file);
        CSVParser parser = new CSVParserBuilder().withSeparator('\t').build();
        DateTimeFormatter dt6 = DateTimeFormatter.ofPattern("yyyy-MM-dd");
        try (CSVReader reader = new CSVReaderBuilder(new FileReader(file)).withCSVParser(parser).build()) {
            reader.readNext(); // skip header
            String[] line;
            int count = 0;
            while ((line = reader.readNext()) != null && count < 1000) {
                if (line.length < 15) continue;
                String customerId    = safe(line[1]);
                String productId     = safe(line[3]);
                String productTitle  = safe(line[5]);
                String categoryStr   = safe(line[6]);
                String starRating    = safe(line[7]);
                String reviewHeadline= safe(line[12]); // review_headline (başlık)
                String reviewBody    = safe(line[13]);
                String reviewDateStr = safe(line[14]);

                if (customerId.isEmpty() || productId.isEmpty()) continue;
                if (starRating.isEmpty()) continue;

                // --- User (with full_name from review_headline as proxy) ---
                String email = "ds6_" + customerId + "@dummy.com";
                User user = userRepository.findByEmail(email).orElse(null);
                if (user == null) {
                    user = new User(email, "hashed_password", "INDIVIDUAL", null);
                    // Store review_headline as a hint in fullName if it looks like a name
                    user = userRepository.save(user);
                }

                Category category = findOrCreateCategory(categoryStr.isEmpty() ? "General" : categoryStr);

                Product product = productRepository.findBySku(productId).orElse(null);
                if (product == null) {
                    product = new Product();
                    product.setSku(productId);
                    product.setName(productTitle.isEmpty() ? "Product " + productId : productTitle);
                    product.setUnitPrice(new BigDecimal("10.0")); // Dummy price
                    product.setStockQuantity(100);
                    product.setCategory(category);
                    product = productRepository.save(product);
                }

                int rating;
                try { rating = Integer.parseInt(starRating); }
                catch (NumberFormatException e) { continue; }

                // Truncate review body if too long
                if (reviewBody.length() > 999) reviewBody = reviewBody.substring(0, 999);
                // Truncate review headline if too long
                if (reviewHeadline.length() > 255) reviewHeadline = reviewHeadline.substring(0, 255);

                // Parse review date
                LocalDate reviewDate = LocalDate.now();
                if (!reviewDateStr.isEmpty()) {
                    try { reviewDate = LocalDate.parse(reviewDateStr, dt6); }
                    catch (DateTimeParseException ignored) {}
                }

                // Determine sentiment
                String sentiment = rating >= 4 ? "Positive" : rating == 3 ? "Neutral" : "Negative";

                Review review = new Review();
                review.setRating(rating);
                review.setComment(reviewBody);
                review.setReviewHeadline(reviewHeadline); // << Yorum başlığı
                review.setSentiment(sentiment);
                review.setDate(reviewDate);              // << Gerçek tarih
                review.setProduct(product);
                review.setUser(user);                    // << Review sahibi user
                reviewRepository.save(review);

                count++;
            }
        }
        System.out.println("DS6 loaded.");
    }

    // -------------------------------------------------------------------------
    // Yardımcı metodlar
    // -------------------------------------------------------------------------
    private Category findOrCreateCategory(String name) {
        Category category = categoryRepository.findByName(name).orElse(null);
        if (category == null) {
            category = new Category();
            category.setName(name);
            category = categoryRepository.save(category);
        }
        return category;
    }

    private String safe(String s) {
        return s == null ? "" : s.trim();
    }

    private double parseDouble(String s) {
        try { return Double.parseDouble(s.replace(",", "").replace(" ", "")); }
        catch (NumberFormatException e) { return 0.0; }
    }

    private int parseInt(String s, int defaultVal) {
        try { return (int) Math.round(Double.parseDouble(s)); }
        catch (NumberFormatException e) { return defaultVal; }
    }
}
