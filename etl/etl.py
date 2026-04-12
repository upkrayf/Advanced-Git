import pandas as pd
import numpy as np
from sqlalchemy import create_engine, text
import warnings
warnings.filterwarnings("ignore")

# ============================================================
#  AYARLAR
# ============================================================
DEV_MODE = True  # DEV_MODE = False yaparak gerçek veritabanına bağlanabilirsin
DB_USER     = "root"
DB_PASSWORD = "admin"        # <- kendi şifreni yaz
DB_HOST     = "localhost"
DB_PORT     = "3306"
DB_NAME     = "datapulse_db"  # <- kendi db adını yaz

engine = create_engine(
    f"mysql+pymysql://{DB_USER}:{DB_PASSWORD}@{DB_HOST}:{DB_PORT}/{DB_NAME}",
    echo=False
)

def log(msg):
    print(f"\n{'='*50}\n  {msg}\n{'='*50}")

def safe_load(df, table_name, chunk_size=500):
    total, errors = 0, 0
    for i in range(0, len(df), chunk_size):
        chunk = df.iloc[i:i+chunk_size]
        try:
            chunk.to_sql(table_name, engine, if_exists="append", index=False)
            total += len(chunk)
        except Exception as e:
            errors += len(chunk)
            print(f"    ! HATA ({table_name}): {str(e)[:200]}")
    print(f"  → {table_name}: {total} kayıt yüklendi, {errors} atlandı")
    return total


# ============================================================
#  ADIM 0 — Tabloları temizle
# ============================================================
log("ADIM 0: Tablolar temizleniyor...")

with engine.connect() as conn:
    conn.execute(text("SET FOREIGN_KEY_CHECKS = 0"))
    for table in ["reviews", "shipments", "order_items", "payments",
                  "orders", "products", "customer_profiles",
                  "stores", "categories", "users"]:
        try:
            conn.execute(text(f"TRUNCATE TABLE {table}"))
            print(f"  → {table} temizlendi")
        except Exception as e:
            print(f"  ! {table}: {e}")
    conn.execute(text("SET FOREIGN_KEY_CHECKS = 1"))
    conn.commit()


# ============================================================
#  ADIM 1 — CATEGORIES
# ============================================================
log("ADIM 1: Categories yükleniyor...")

categories = pd.DataFrame([
    {"id": 1,  "name": "Electronics"},
    {"id": 2,  "name": "Clothing"},
    {"id": 3,  "name": "Home & Garden"},
    {"id": 4,  "name": "Books"},
    {"id": 5,  "name": "Sports"},
    {"id": 6,  "name": "Beauty"},
    {"id": 7,  "name": "Toys"},
    {"id": 8,  "name": "Food"},
    {"id": 9,  "name": "Automotive"},
    {"id": 10, "name": "Office"},
])
categories["parent_id"] = None
safe_load(categories, "categories")


# ============================================================
#  ADIM 2 — STORES
# ============================================================
log("ADIM 2: Stores yükleniyor...")

stores = pd.DataFrame([
    {"id": 1, "name": "UCI Global Store", "status": "OPEN", "owner_id": None},
    {"id": 2, "name": "Amazon US Store",  "status": "OPEN", "owner_id": None},
    {"id": 3, "name": "Pakistan Store",   "status": "OPEN", "owner_id": None},
])
safe_load(stores, "stores")


# ============================================================
#  ADIM 3 — DS2: USERS ve CUSTOMER_PROFILES
# ============================================================
log("ADIM 3: DS2 — Users ve CustomerProfiles yükleniyor...")

# BURAYA EKLENDI: nrows=1000
df2 = pd.read_csv("data/ds2.csv", nrows=1000)
df2 = df2.dropna(subset=["Customer ID"]).drop_duplicates(subset=["Customer ID"])
print(f"  DS2: {len(df2)} satır (Sınırlandırılmış)")

users = pd.DataFrame()
users["id"]            = (df2["Customer ID"].astype(int) + 10000).astype(int)
users["email"]         = "user" + df2["Customer ID"].astype(str) + "@datapulse.com"
users["password_hash"] = "$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LMTIHLMfGXi"
users["role_type"]     = "INDIVIDUAL"
users["gender"]        = df2["Gender"].values

safe_load(users, "users")

profiles = pd.DataFrame()
profiles["age"]             = pd.to_numeric(df2["Age"], errors="coerce").values
profiles["city"]            = df2["City"].values
profiles["membership_type"] = df2["Membership Type"].values
profiles["user_id"]         = users["id"].values

safe_load(profiles, "customer_profiles")


# ============================================================
#  ADIM 4 — DS1: PRODUCTS, ORDERS, ORDER_ITEMS
# ============================================================
log("ADIM 4: DS1 — Products, Orders, OrderItems yükleniyor...")

# BURAYA EKLENDI: nrows=1000
df1 = pd.read_csv("data/ds1.csv", encoding="latin1", nrows=1000)
print(f"  DS1 ham: {len(df1)} satır (Sınırlandırılmış)")

df1 = df1.dropna(subset=["Invoice", "StockCode"])
df1 = df1[pd.to_numeric(df1["Quantity"], errors="coerce") > 0]
df1 = df1[pd.to_numeric(df1["Price"],    errors="coerce") > 0]
df1["InvoiceDate"] = pd.to_datetime(df1["InvoiceDate"], errors="coerce")
df1 = df1.dropna(subset=["InvoiceDate"])
df1["Quantity"] = pd.to_numeric(df1["Quantity"], errors="coerce").fillna(1).astype(int)
df1["Price"]    = pd.to_numeric(df1["Price"],    errors="coerce").fillna(0)

products_raw = df1[["StockCode", "Description", "Price"]].drop_duplicates(subset=["StockCode"])
products_raw = products_raw.dropna(subset=["Description"])

np.random.seed(42)
products = pd.DataFrame()
products["id"]             = range(1, len(products_raw) + 1)
products["sku"]            = products_raw["StockCode"].astype(str).values
products["name"]           = products_raw["Description"].astype(str).str[:200].values
products["description"]    = products_raw["Description"].astype(str).values  
products["unit_price"]     = products_raw["Price"].values
products["stock_quantity"] = np.random.randint(10, 500, size=len(products))  
products["category_id"]    = np.random.randint(1, 11, size=len(products))
products["store_id"]       = 1
products["icon"]           = None

sku_to_id = dict(zip(products["sku"], products["id"]))
safe_load(products, "products")

orders_raw = df1.drop_duplicates(subset=["Invoice"])
orders = pd.DataFrame()
orders["id"]           = range(1, len(orders_raw) + 1)
orders["order_number"] = orders_raw["Invoice"].astype(str).values   
orders["order_date"]   = orders_raw["InvoiceDate"].values            
orders["grand_total"]  = 0.0
orders["status"]       = "COMPLETED"

customer_ids = pd.to_numeric(orders_raw["Customer ID"], errors="coerce")
orders["user_id"]      = (customer_ids + 10000).astype("Int64")

invoice_to_order_id = dict(zip(orders_raw["Invoice"].values, orders["id"].values))
safe_load(orders, "orders")

order_items = pd.DataFrame()
order_items["order_id"]   = df1["Invoice"].map(invoice_to_order_id)
order_items["product_id"] = df1["StockCode"].astype(str).map(sku_to_id)
order_items["quantity"]   = df1["Quantity"].values
order_items["price"]      = df1["Price"].values
order_items = order_items.dropna(subset=["order_id", "product_id"])
order_items["order_id"]   = order_items["order_id"].astype(int)
order_items["product_id"] = order_items["product_id"].astype(int)

safe_load(order_items, "order_items")

print("  → Orders grand_total güncelleniyor...")
with engine.connect() as conn:
    conn.execute(text("""
        UPDATE orders o
        SET grand_total = (
            SELECT COALESCE(SUM(oi.quantity * oi.price), 0)
            FROM order_items oi WHERE oi.order_id = o.id
        )
    """))
    conn.commit()
print("  → grand_total güncellendi")


# ============================================================
#  ADIM 5 — DS3: SHIPMENTS
# ============================================================
log("ADIM 5: DS3 — Shipments yükleniyor...")

# BURAYA EKLENDI: nrows=1000
df3 = pd.read_csv("data/ds3.csv", nrows=1000)
df3 = df3.dropna(subset=["ID"]).drop_duplicates(subset=["ID"])
print(f"  DS3: {len(df3)} satır (Sınırlandırılmış)")

shipments = pd.DataFrame()
shipments["id"]                 = df3["ID"].astype(int)
shipments["warehouse_block"]    = df3["Warehouse_block"].values       
shipments["mode_of_shipment"]   = df3["Mode_of_Shipment"].values      
shipments["reaching_on_time"]   = pd.to_numeric(
                                      df3["Reached.on.Time_Y.N"],
                                      errors="coerce"
                                  ).fillna(1).astype(int).values      
shipments["product_importance"] = df3["Product_importance"].values    

safe_load(shipments, "shipments")


# ============================================================
#  ADIM 6 — DS4: ORDERS (Amazon)
# ============================================================
log("ADIM 6: DS4 — Amazon Orders yükleniyor...")

# BURAYA EKLENDI: nrows=1000
df4 = pd.read_csv("data/ds4.csv", encoding="latin1", nrows=1000)
df4.columns = df4.columns.str.strip()
df4 = df4.dropna(subset=["Order ID"]).drop_duplicates(subset=["Order ID"])
df4["Date"] = pd.to_datetime(df4["Date"], errors="coerce")
print(f"  DS4: {len(df4)} satır (Sınırlandırılmış)")

amazon_orders = pd.DataFrame()
amazon_orders["id"]           = range(100001, 100001 + len(df4))
amazon_orders["order_number"] = df4["Order ID"].astype(str).values
amazon_orders["order_date"]   = df4["Date"].values
amazon_orders["grand_total"]  = pd.to_numeric(df4["Amount"], errors="coerce").fillna(0).values
amazon_orders["status"]       = df4["Status"].fillna("COMPLETED").values
amazon_orders["user_id"]      = None

safe_load(amazon_orders, "orders")


# ============================================================
#  ADIM 7 — DS5: ORDERS ve PAYMENTS (Pakistan)
# ============================================================
log("ADIM 7: DS5 — Pakistan Orders ve Payments yükleniyor...")

# BURAYA EKLENDI: nrows=1000
df5 = pd.read_csv("data/ds5.csv", encoding="latin1", nrows=1000)
unnamed_cols = [c for c in df5.columns if "Unnamed" in c]
df5 = df5.drop(columns=unnamed_cols, errors="ignore")
df5 = df5.dropna(subset=["increment_id"]).drop_duplicates(subset=["increment_id"])
df5["created_at"] = pd.to_datetime(df5["created_at"], errors="coerce")
print(f"  DS5: {len(df5)} satır (Sınırlandırılmış)")

pak_orders = pd.DataFrame()
pak_orders["id"]           = range(200001, 200001 + len(df5))
pak_orders["order_number"] = df5["increment_id"].astype(str).values
pak_orders["order_date"]   = df5["created_at"].values
pak_orders["grand_total"]  = pd.to_numeric(df5["grand_total"], errors="coerce").fillna(0).values
pak_orders["status"]       = df5["status"].fillna("COMPLETED").values
pak_orders["user_id"]      = None

safe_load(pak_orders, "orders")

payments = pd.DataFrame()
payments["payment_type"]  = df5["payment_method"].fillna("CASH").values  
payments["payment_value"] = pak_orders["grand_total"].values              
payments["order_id"]      = pak_orders["id"].values

safe_load(payments, "payments")


# ============================================================
#  ADIM 8 — DS6: REVIEWS
# ============================================================
log("ADIM 8: DS6 — Amazon Reviews yükleniyor...")

# DEĞİŞTİRİLDİ: nrows=50000 yerine nrows=1000 yapıldı
df6 = pd.read_csv("data/ds6.tsv", sep="\t", encoding="utf-8",
                  nrows=1000, on_bad_lines="skip")
df6 = df6.dropna(subset=["star_rating"])
df6["star_rating"] = pd.to_numeric(df6["star_rating"], errors="coerce")
df6 = df6[df6["star_rating"].between(1, 5)]
print(f"  DS6: {len(df6)} satır (Sınırlandırılmış)")

def sentiment(r):
    if r >= 4:   return "POSITIVE"
    elif r == 3: return "NEUTRAL"
    else:        return "NEGATIVE"

reviews = pd.DataFrame()
reviews["comment"]    = df6["review_body"].fillna("").astype(str).str[:1000].values  
reviews["rating"]     = df6["star_rating"].astype(int).values                        
reviews["sentiment"]  = df6["star_rating"].apply(sentiment).values
reviews["review_date"]       = df6["review_date"].astype(str).values                        
reviews["product_id"] = None  

safe_load(reviews, "reviews")


# ============================================================
#  SONUÇ
# ============================================================
log("ETL TAMAMLANDI — Özet")

with engine.connect() as conn:
    for table in ["categories", "stores", "users", "customer_profiles",
                  "products", "orders", "order_items",
                  "shipments", "payments", "reviews"]:
        try:
            count = conn.execute(text(f"SELECT COUNT(*) FROM {table}")).scalar()
            print(f"  {table:<25} → {count:>8} kayıt")
        except Exception as e:
            print(f"  {table:<25} → HATA: {e}")

print("\n  Tüm veriler yüklendi!")