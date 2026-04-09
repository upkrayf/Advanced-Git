package com.datapulse.backend.service;

import com.datapulse.backend.entity.*;
import com.datapulse.backend.repository.*;
import com.opencsv.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.InputStreamReader;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.*;

@Service
public class EtlService {

    private final CategoryRepository categoryRepository;
    private final ProductRepository productRepository;
    private final OrderRepository orderRepository;
    private final ShipmentRepository shipmentRepository;
    private final UserRepository userRepository;
    private final PaymentRepository paymentRepository;
    private final ReviewRepository reviewRepository;
    private final CustomerProfileRepository customerProfileRepository;
    private final StoreRepository storeRepository;
    private final OrderItemRepository orderItemRepository;

    public EtlService(CategoryRepository categoryRepository, ProductRepository productRepository,
                      OrderRepository orderRepository, ShipmentRepository shipmentRepository,
                      UserRepository userRepository, PaymentRepository paymentRepository,
                      ReviewRepository reviewRepository, CustomerProfileRepository customerProfileRepository,
                      StoreRepository storeRepository, OrderItemRepository orderItemRepository) {
        this.categoryRepository = categoryRepository;
        this.productRepository = productRepository;
        this.orderRepository = orderRepository;
        this.shipmentRepository = shipmentRepository;
        this.userRepository = userRepository;
        this.paymentRepository = paymentRepository;
        this.reviewRepository = reviewRepository;
        this.customerProfileRepository = customerProfileRepository;
        this.storeRepository = storeRepository;
        this.orderItemRepository = orderItemRepository;
    }

    @Transactional
    public void runEtlProcess() {
        System.out.println("🚀 ETL Final Operasyonu Başlıyor...");
        try {
            importCategories();
            importUsersAndProfiles();
            Store store = ensureStore();
            importProducts(store);
            importOrders();         // Mükerrer kontrolü eklendi
            importOrderItems();     // Hata koruması eklendi
            importPayments();
            importShipments();
            importReviews();

            System.out.println("✅ ETL BAŞARIYLA BİTTİ BEREN! Artık Frontend'e geçebiliriz.");
        } catch (Exception e) {
            System.err.println("❌ KRİTİK HATA: " + e.getMessage());
            e.printStackTrace();
        }
    }

    private void importCategories() throws Exception {
        if (categoryRepository.count() > 0) return;
        Set<String> names = new HashSet<>();
        try (CSVReader reader = new CSVReader(new InputStreamReader(getClass().getResourceAsStream("/data/ds4.csv")))) {
            reader.readNext(); String[] line;
            while ((line = reader.readNext()) != null) {
                if (line.length > 9) names.add(line[9].trim());
            }
        }
        names.forEach(n -> categoryRepository.save(new Category(n)));
        System.out.println("📂 Kategoriler yüklendi.");
    }

    private void importUsersAndProfiles() throws Exception {
        if (userRepository.count() > 5) return;
        try (CSVReader reader = new CSVReader(new InputStreamReader(getClass().getResourceAsStream("/data/ds2.csv")))) {
            reader.readNext(); String[] line;
            int count = 0;
            while ((line = reader.readNext()) != null && count < 100) {
                User u = new User();
                u.setEmail("user_" + line[0] + "@datapulse.com");
                u.setPasswordHash("pass123");
                u.setRoleType("INDIVIDUAL");
                u.setGender(line[1]);
                u = userRepository.save(u);

                CustomerProfile p = new CustomerProfile();
                p.setUser(u);
                p.setAge(Integer.parseInt(line[2]));
                p.setCity(line[3]);
                p.setMembershipType(line[4]);
                customerProfileRepository.save(p);
                count++;
            }
        }
        System.out.println("👤 Kullanıcılar yüklendi.");
    }

    private void importProducts(Store store) throws Exception {
        if (productRepository.count() > 5) return;
        List<Category> cats = categoryRepository.findAll();
        try (CSVReader reader = new CSVReader(new InputStreamReader(getClass().getResourceAsStream("/data/ds1.csv")))) {
            reader.readNext(); String[] line;
            int count = 0;
            while ((line = reader.readNext()) != null && count < 150) {
                if (productRepository.findBySku(line[1]).isPresent()) continue;
                Product p = new Product();
                p.setSku(line[1]);
                p.setName(line[2]);
                p.setUnitPrice(new BigDecimal(line[5]));
                p.setStore(store);
                p.setIcon("📦");
                if (!cats.isEmpty()) p.setCategory(cats.get(count % cats.size()));
                p.setDescription(line[2]);
                p.setStockQuantity(Integer.valueOf(line[3]));
                productRepository.save(p);
                count++;
            }
        }
        System.out.println("📦 Ürünler yüklendi.");
    }

    private void importOrders() throws Exception {
        if (orderRepository.count() > 5) return;
        List<User> users = userRepository.findAll();
        Set<String> processedOrderNumbers = new HashSet<>(); 
        
        try (CSVReader reader = new CSVReader(new InputStreamReader(getClass().getResourceAsStream("/data/ds5.csv")))) {
            reader.readNext(); String[] line;
            int count = 0;
            while ((line = reader.readNext()) != null && count < 100) {
                String orderNum = line[7];
                // Hem RAM'de hem DB'de kontrol ediyoruz
                if (processedOrderNumbers.contains(orderNum) || orderRepository.existsByOrderNumber(orderNum)) {
                    continue; 
                }
                Order o = new Order();
                o.setOrderNumber(orderNum);
                o.setStatus(line[1]);
                o.setGrandTotal(new BigDecimal(line[6]));
                o.setOrderDate(LocalDateTime.now());
                o.setUser(users.get(count % users.size()));
                orderRepository.save(o);
                processedOrderNumbers.add(orderNum);
                count++;
            }
        }
        System.out.println("🛒 Siparişler yüklendi.");
    }

    private void importOrderItems() throws Exception {
    if (orderItemRepository.count() > 5) return;

    // 1. ADIM: Hızlandırmak için tüm siparişleri ve ürünleri bir kerede RAM'e alıyoruz
    // Map<SiparişNo, SiparişNesnesi>
    Map<String, Order> orderMap = new HashMap<>();
    orderRepository.findAll().forEach(o -> orderMap.put(o.getOrderNumber(), o));

    // Map<SKU, ÜrünNesnesi>
    Map<String, Product> productMap = new HashMap<>();
    productRepository.findAll().forEach(p -> productMap.put(p.getSku(), p));

    System.out.println("⚡ Hafıza hazır, eşleştirme başlıyor...");

    try (CSVReader reader = new CSVReader(new InputStreamReader(getClass().getResourceAsStream("/data/ds5.csv")))) {
        reader.readNext(); // Header atla
        String[] line;
        int count = 0;
        
        while ((line = reader.readNext()) != null && count < 150) {
            String orderNum = line[7];
            String sku = line[3];

            // 2. ADIM: Veritabanı yerine doğrudan Map'ten (RAM) kontrol et
            Order order = orderMap.get(orderNum);
            Product product = productMap.get(sku);

            if (order != null && product != null) {
                OrderItem item = new OrderItem();
                item.setOrder(order);
                item.setProduct(product);
                item.setQuantity(Integer.parseInt(line[5]));
                item.setPrice(new BigDecimal(line[4]));
                
                orderItemRepository.save(item);
                count++;
                
                if (count % 25 == 0) System.out.println("🗒️ Kalem eşleşti: " + count);
            }
        }
    }
    System.out.println("✅ Sipariş kalemleri saniyeler içinde yüklendi.");
}

    private void importPayments() throws Exception {
        if (paymentRepository.count() > 5) return;
        List<Order> orders = orderRepository.findAll();
        try (CSVReader reader = new CSVReader(new InputStreamReader(getClass().getResourceAsStream("/data/ds5.csv")))) {
            reader.readNext(); String[] line;
            int count = 0;
            while ((line = reader.readNext()) != null && count < orders.size()) {
                Payment p = new Payment();
                p.setOrder(orders.get(count));
                p.setPaymentType(line[11]);
                p.setPaymentValue(orders.get(count).getGrandTotal());
                paymentRepository.save(p);
                count++;
            }
        }
        System.out.println("💰 Ödemeler yüklendi.");
    }

    private void importShipments() throws Exception {
        if (shipmentRepository.count() > 5) return;
        List<Order> orders = orderRepository.findAll();
        try (CSVReader reader = new CSVReader(new InputStreamReader(getClass().getResourceAsStream("/data/ds3.csv")))) {
            reader.readNext(); String[] line;
            int count = 0;
            while ((line = reader.readNext()) != null && count < orders.size()) {
                Shipment s = new Shipment();
                s.setWarehouseBlock(line[1]);
                s.setModeOfShipment(line[2]);
                s.setProductImportance(line[7]);
                s.setReachingOnTime(Integer.parseInt(line[11]));
                Order o = orders.get(count);
                o.setShipment(s);
                orderRepository.save(o);
                count++;
            }
        }
        System.out.println("🚚 Kargolar yüklendi.");
    }

    private void importReviews() throws Exception {
        if (reviewRepository.count() > 5) return;
        List<Product> products = productRepository.findAll();
        CSVParser parser = new CSVParserBuilder().withSeparator('\t').build();
        try (CSVReader reader = new CSVReaderBuilder(new InputStreamReader(getClass().getResourceAsStream("/data/ds6.tsv")))
                .withCSVParser(parser).build()) {
            reader.readNext(); String[] line;
            int count = 0;
            while ((line = reader.readNext()) != null && count < 100) {
                Review r = new Review();
                int stars = Integer.parseInt(line[7]);
                r.setRating(stars);
                r.setComment(line[13]);
                r.setSentiment(stars >= 4 ? "Positive" : "Negative");
                r.setProduct(products.get(count % products.size()));
                r.setDate(line[14]);
                reviewRepository.save(r);
                count++;
            }
        }
        System.out.println("⭐ Yorumlar yüklendi.");
    }

    private Store ensureStore() {
        return storeRepository.findAll().stream().findFirst().orElseGet(() -> {
            Store s = new Store();
            s.setName("DataPulse Global Store");
            s.setStatus("ACTIVE");
            return storeRepository.save(s);
        });
    }
}