# Proje Yönergesi: E-Commerce Analytics Platform with Multi-Agent Text2SQL AI Chatbot

## 1. Proje Genel Bakış
[cite_start]Bu proje, modern iş zekası araçlarından ilham alan kapsamlı bir e-ticaret veri analitiği platformudur[cite: 10]. Platform; [cite_start]Admin, Kurumsal Kullanıcı ve Bireysel Kullanıcı olmak üzere üç farklı rol tipine hizmet verecek ve kullanıcıların doğal dildeki sorularını veritabanı sorgularına çeviren yapay zeka destekli çoklu etmenli (multi-agent) bir Text2SQL sohbet robotu içerecektir[cite: 11].

## 2. Teknoloji Yığını
* [cite_start]**Backend:** Spring Boot[cite: 5].
* [cite_start]**Frontend:** Angular[cite: 6].
* [cite_start]**Veritabanı:** MySQL veya PostgreSQL (application properties üzerinden yapılandırılabilir olmalıdır)[cite: 7, 73].
* [cite_start]**Yapay Zeka Entegrasyonu:** LangGraph ve Chainlit kullanılarak Agentic AI[cite: 8].

## 3. Veritabanı ve Şema Gereksinimleri
[cite_start]Kapsamlı e-ticaret veri kümeleri birleştirilerek aşağıdaki normalize edilmiş ilişkisel şema oluşturulmalıdır[cite: 30, 31, 37]:
* [cite_start]**Ana Tablolar:** `USERS`, `STORES`, `CUSTOMER_PROFILES`, `ORDERS`, `ORDER_ITEMS`, `SHIPMENTS`, `PRODUCTS`, `REVIEWS`, `CATEGORIES`[cite: 45, 46, 47, 48, 49].
* [cite_start]**ETL ve Veri Dönüşümü:** Eksik veriler temizlenmeli, birleştirilmiş varlıklar için vekil anahtarlar (surrogate keys) oluşturulmalı, tüm tarihler ISO 8601 formatına standartlaştırılmalı ve fiyatlar kur meta verileriyle tek bir para birimine normalize edilmelidir[cite: 50, 52, 53, 54, 55].

## 4. Backend (Spring Boot) Gereksinimleri
* [cite_start]Tüm varlıklar için RESTful API standartlarına uygun CRUD işlemleri tasarlanmalıdır[cite: 58].
* [cite_start]Yenileme belirteci (refresh token) desteğiyle JWT tabanlı kimlik doğrulama uygulanmalıdır[cite: 59].
* [cite_start]Spring Security kullanılarak rol tabanlı erişim kontrolü (RBAC) kurulmalıdır[cite: 60].
* [cite_start]Veri katmanında JPA/Hibernate kullanılmalı ve sohbet robotunun ürettiği SQL sorguları için dinamik sorgu oluşturucu (dynamic query builder) eklenmelidir[cite: 61, 62].
* [cite_start]Swagger/OpenAPI dokümantasyonu ve anlamlı hata yanıtları veren global istisna yakalayıcı (global exception handler) sisteme dahil edilmelidir[cite: 63, 64].

## 5. Frontend (Angular) Gereksinimleri
* [cite_start]Mobil öncelikli (mobile-first) ve duyarlı (responsive) bir tasarım benimsenmelidir[cite: 66].
* [cite_start]Tembel yükleme (lazy loading) özellikli modüler bileşen mimarisi ve NgRx (veya servis tabanlı) state management kullanılmalıdır[cite: 67, 68].
* [cite_start]Chart.js, D3.js veya ngx-charts kullanılarak analitik metrikler için dinamik veri görselleştirmeleri yapılmalıdır[cite: 69, 71].
* [cite_start]Yapay zeka asistanı ile iletişim için gerçek zamanlı bir sohbet arayüzü (UI) geliştirilmelidir[cite: 70].

## 6. Multi-Agent Text2SQL Yapay Zeka Sohbet Robotu
[cite_start]Bu modül, teknik olmayan kullanıcıların veritabanını İngilizce doğal dil kullanarak sorgulamasını sağlayacaktır[cite: 103, 107].
* [cite_start]**Mimari ve Altyapı:** Durum makinesi (state machine) mimarisi için LangGraph, model olarak OpenAI (gpt-4o-mini) veya alternatif bir LLM kullanılacaktır[cite: 114, 116]. [cite_start]Grafikler Plotly ile çizilecektir[cite: 117].
* **Etmenler (Agents):** Beş farklı özelleşmiş etmen birlikte çalışmalıdır:
    1.  [cite_start]**Guardrails Agent:** Soruların e-ticaret veri analizi kapsamında olup olmadığını doğrular[cite: 122].
    2.  [cite_start]**SQL Agent:** Açıklama yapmadan yalnızca geçerli SQL sorguları üretir[cite: 122].
    3.  [cite_start]**Error Agent:** Veritabanı şeması bilgisiyle SQL hatalarını teşhis edip düzeltir[cite: 122].
    4.  [cite_start]**Analysis Agent:** Veritabanı sorgu sonuçlarını kullanıcılara doğal dille ve net içgörülerle açıklar[cite: 122].
    5.  [cite_start]**Visualization Agent:** Uygun görüldüğünde verileri görselleştirmek için temiz ve çalıştırılabilir Plotly kodları üretir[cite: 122].
* [cite_start]**Durum Yönetimi (State Management):** Python'da tip güvenliği sağlamak için `TypedDict` kullanılmalı ve state içeriği `question, sql_query, query_result, error, final_answer, visualization_code, is_in_scope, iteration_count` parametrelerini barındırmalıdır[cite: 136, 139].
* [cite_start]**Backend Entegrasyonu:** Python/LangGraph tabanlı yapay zeka servisi, Spring Boot backend'i ile REST API (örn. `/api/chat/ask`) üzerinden haberleşmelidir[cite: 177, 178].

## 7. Yetkilendirme Kontrolleri
[cite_start]Sohbet robotu ve dashboard erişimleri, kullanıcının rolüne göre veri yalıtım (data segregation) prensiplerine uymalıdır[cite: 171].
* [cite_start]**Bireysel:** Yalnızca kendi siparişleri, harcamaları ve incelemeleri[cite: 174].
* [cite_start]**Kurumsal:** Yalnızca kendi mağazasına ait ürünler, siparişler ve satış verileri[cite: 174].
* [cite_start]**Admin:** Tüm mağazalar ve toplanmış (aggregate) veriler dahil tüm platform[cite: 175].

