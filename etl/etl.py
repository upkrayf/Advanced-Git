#!/usr/bin/env python3
"""ETL script for creating the project database from the CSV/TSV dataset files.

Usage:
  pip install sqlalchemy bcrypt pymysql
  export DATABASE_URL='mysql+pymysql://root:admin@localhost/datapulse_db'
  python etl.py

If DATABASE_URL is not set, the script creates a local SQLite database file at etl.db.
"""
import csv
import datetime
import os
import re
import random
from decimal import Decimal
from pathlib import Path

try:
    import bcrypt
except ImportError:
    bcrypt = None

from sqlalchemy import (
    create_engine,
    Column,
    Integer,
    String,
    Text,
    DateTime,
    Date,
    Numeric,
    ForeignKey,
)
from sqlalchemy.orm import declarative_base, relationship, sessionmaker

Base = declarative_base()
DATA_DIR = Path(__file__).resolve().parent / "data"
MAX_ROWS = 1000


def normalize_key(value: str) -> str:
    if value is None:
        return ""
    key = value.strip().lower()
    key = re.sub(r"[^a-z0-9]+", "_", key)
    return key.strip("_")


def parse_int(value, default=None):
    if value is None:
        return default
    try:
        return int(float(str(value).strip()))
    except Exception:
        return default


def parse_decimal(value, default=Decimal("0.0")):
    if value is None:
        return default
    try:
        text = str(value).strip().replace('\\n', '').replace('\\r', '').replace(' ', '')
        if text == '':
            return default
        return Decimal(text)
    except Exception:
        try:
            return Decimal(str(value).strip().replace(',', '.'))
        except Exception:
            return default


def parse_datetime(value):
    if value is None:
        return None
    text = str(value).strip()
    if text == "":
        return None

    formats = [
        "%Y-%m-%d %H:%M:%S",
        "%Y-%m-%d",
        "%m/%d/%Y",
        "%m/%d/%Y %H:%M",
        "%m/%d/%Y %H:%M:%S",
        "%d-%m-%Y",
        "%d-%m-%Y %H:%M:%S",
        "%Y-%m-%dT%H:%M:%S",
        "%m-%d-%y",
        "%m-%d-%Y",
        "%Y/%m/%d",
        "%d.%m.%Y",
    ]
    for fmt in formats:
        try:
            return datetime.datetime.strptime(text, fmt)
        except ValueError:
            continue
    # Last resort: try to parse ISO-like formats
    try:
        return datetime.datetime.fromisoformat(text)
    except Exception:
        return None


def parse_date(value):
    dt = parse_datetime(value)
    return dt.date() if dt else None


def hash_password(password: str) -> str:
    if bcrypt:
        return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")
    return password


def get_database_url() -> str:
    url = os.environ.get("DATABASE_URL") or os.environ.get("ETL_DATABASE_URL")
    if url:
        return url
    return f"sqlite:///{Path(__file__).resolve().parent/'etl.db'}"


def read_dataset(file_name: str, delimiter=",", encoding="latin1"):
    path = DATA_DIR / file_name
    rows = []
    with open(path, "r", encoding=encoding, errors="ignore") as fp:
        reader = csv.reader(fp, delimiter=delimiter)
        try:
            header_row = next(reader)
        except StopIteration:
            return []
        header = [normalize_key(col) for col in header_row]
        for raw_row in reader:
            if not raw_row or all(not cell.strip() for cell in raw_row):
                continue
            row = raw_row
            if len(row) == len(header) + 1 and row[0].isdigit():
                row = row[1:]
            # If the row has fewer values, pad with empty strings.
            if len(row) < len(header):
                row = list(row) + [""] * (len(header) - len(row))
            rows.append({header[i]: row[i].strip() if i < len(row) else "" for i in range(len(header))})
    return rows


def load_users(ds2, ds5, ds1):
    users = []
    mapped = {}

    def add_user(customer_id, gender, source):
        if not customer_id:
            return None
        key = str(customer_id).strip()
        if key == "" or key.lower() == "nan":
            return None
        if key in mapped:
            return mapped[key]
        email = f"customer_{re.sub(r'[^0-9a-zA-Z]', '_', key)}@example.com"
        gender_text = None
        if gender:
            gender_lower = gender.strip().lower()
            if gender_lower.startswith("m"):
                gender_text = "Male"
            elif gender_lower.startswith("f"):
                gender_text = "Female"
            else:
                gender_text = gender.strip()
        user = User(
            email=email,
            password_hash=hash_password("123"),
            role_type="INDIVIDUAL",
            gender=gender_text or "Unknown",
        )
        mapped[key] = user
        users.append(user)
        return user

    users.append(User(email="admin@test.com", password_hash=hash_password("123"), role_type="ADMIN", gender="Unknown"))
    corporate_user = User(email="corporate@test.com", password_hash=hash_password("123"), role_type="CORPORATE", gender="Unknown")
    users.append(corporate_user)

    for row in ds2:
        add_user(row.get("customer_id"), row.get("gender"), "ds2")
        if len(users) >= MAX_ROWS:
            break

    for row in ds5:
        add_user(row.get("customer_id"), row.get("gender"), "ds5")
        if len(users) >= MAX_ROWS:
            break

    for row in ds1:
        add_user(row.get("customer_id"), row.get("country"), "ds1")
        if len(users) >= MAX_ROWS:
            break

    return users, mapped, corporate_user


def load_categories(ds4, ds5, ds6):
    categories = {}
    def add_category(name):
        if not name:
            return
        key = name.strip().title()
        if key and key not in categories:
            categories[key] = Category(name=key)
    for row in ds4:
        add_category(row.get("category"))
        add_category(row.get("product_category"))
    for row in ds5:
        add_category(row.get("category_name_1"))
    for row in ds6:
        add_category(row.get("product_category"))
    if not categories:
        categories["General"] = Category(name="General")
    return list(categories.values()), categories


def load_stores(corporate_user):
    store = Store(name="Pulse Store", status="Active", owner=corporate_user)
    return [store]


def build_product_sku(row, fallback=None):
    for key in ("sku", "stockcode", "product_id", "asin", "item_id"):
        value = row.get(key)
        if value:
            return str(value).strip()
    return str(fallback).strip() if fallback else None


def load_products(ds1, ds4, ds5, ds6, categories, store):
    products = {}

    def add_product(sku, name=None, description=None, price=None, category_name=None):
        if not sku:
            return None
        sku = str(sku).strip()
        if sku == "" or sku in products or len(products) >= MAX_ROWS:
            return products.get(sku)
        category = None
        if category_name:
            category = categories.get(str(category_name).strip().title())
        if not category and categories:
            category = next(iter(categories.values()))
        unit_price = parse_decimal(price, default=Decimal("0.0"))
        quantity = random.randint(5, 200)
        product = Product(
            sku=sku,
            name=str(name or sku)[:255],
            description=str(description or name or sku)[:1000],
            unit_price=unit_price,
            stock_quantity=quantity,
            category=category,
            store=store,
            icon="https://via.placeholder.com/150",
        )
        products[sku] = product
        return product

    for row in ds1:
        add_product(
            build_product_sku(row),
            name=row.get("description"),
            description=row.get("description"),
            price=row.get("price") or row.get("unit_price"),
            category_name=row.get("category"),
        )
        if len(products) >= MAX_ROWS:
            break

    for row in ds5:
        add_product(
            build_product_sku(row),
            name=row.get("sku"),
            description=row.get("sku"),
            price=row.get("price") or row.get("grand_total"),
            category_name=row.get("category_name_1"),
        )
        if len(products) >= MAX_ROWS:
            break

    for row in ds6:
        add_product(
            build_product_sku(row),
            name=row.get("product_title"),
            description=row.get("review_body") or row.get("product_title"),
            price=row.get("price"),
            category_name=row.get("product_category"),
        )
        if len(products) >= MAX_ROWS:
            break

    for row in ds4:
        sku = row.get("sku") or row.get("asin") or ""
        if not sku and "last_row_values" in row:
            raw = row["last_row_values"]
            if len(raw) > 11:
                sku = raw[11]
        add_product(
            sku,
            name=row.get("style") or row.get("sku"),
            description=row.get("category"),
            price=row.get("amount"),
            category_name=row.get("category"),
        )
        if len(products) >= MAX_ROWS:
            break

    return list(products.values()), products


def load_shipments(ds3):
    shipments = []
    for row in ds3:
        if len(shipments) >= MAX_ROWS:
            break
        shipments.append(
            Shipment(
                warehouse_block=row.get("warehouse_block"),
                mode_of_shipment=row.get("mode_of_shipment") or row.get("mode_of_shipment"),
                reaching_on_time=parse_int(row.get("reached_on_time_y_n"), default=0),
                product_importance=row.get("product_importance"),
            )
        )
    if not shipments:
        shipments.append(Shipment(warehouse_block="A", mode_of_shipment="Road", reaching_on_time=1, product_importance="medium"))
    return shipments


def load_orders(ds1, ds4, ds5, users_map):
    orders = {}

    def add_order(key, order_number, order_date, status, total, user_key):
        if not key or key in orders or len(orders) >= MAX_ROWS:
            return None
        user = users_map.get(str(user_key)) or users_map.get(str(user_key).split('.')[0])
        if not user:
            user = next(iter(users_map.values()), None)
        order = Order(
            order_number=str(order_number)[:255],
            order_date=parse_datetime(order_date) or datetime.datetime.now(),
            grand_total=parse_decimal(total, default=Decimal("0.0")),
            status=str(status or "Completed")[:255],
            user=user,
        )
        orders[key] = order
        return order

    invoices = {}
    for row in ds1:
        invoice = row.get("invoice") or row.get("order")
        if not invoice:
            continue
        invoices.setdefault(invoice, []).append(row)
    for invoice, rows in invoices.items():
        if len(orders) >= MAX_ROWS:
            break
        total = Decimal("0.0")
        for row in rows:
            total += parse_decimal(row.get("price"), default=Decimal("0.0")) * Decimal(parse_int(row.get("quantity"), default=1))
        status = "Cancelled" if str(invoice).upper().startswith("C") else "Completed"
        add_order(invoice, invoice, rows[0].get("invoice_date"), status, total, rows[0].get("customer_id"))

    for row in ds5:
        order_key = row.get("increment_id") or row.get("item_id")
        if not order_key or order_key in orders or len(orders) >= MAX_ROWS:
            continue
        status = row.get("status") or "Completed"
        order_date = row.get("created_at") or row.get("working_date")
        total = row.get("grand_total") or row.get("price")
        add_order(order_key, order_key, order_date, status, total, row.get("customer_id"))

    for row in ds4:
        order_key = row.get("courindex") or row.get("order_id")
        if not order_key or order_key in orders or len(orders) >= MAX_ROWS:
            continue
        status = row.get("status") or "Completed"
        order_date = row.get("date") or row.get("order_date")
        total = row.get("amount")
        add_order(order_key, order_key, order_date, status, total, row.get("customer_id") or row.get("customer_id"))

    return list(orders.values()), orders


def load_order_items(ds1, ds5, orders_map, products_map):
    order_items = []

    def add_item(order_key, product_sku, quantity, price):
        if len(order_items) >= MAX_ROWS:
            return
        order = orders_map.get(order_key)
        product = products_map.get(str(product_sku).strip())
        if not order or not product:
            return
        order_items.append(
            OrderItem(
                order=order,
                product=product,
                quantity=parse_int(quantity, default=1),
                price=parse_decimal(price, default=Decimal("0.0")),
            )
        )

    for row in ds1:
        invoice = row.get("invoice")
        if invoice:
            add_item(invoice, row.get("stockcode"), row.get("quantity"), row.get("price"))
    for row in ds5:
        order_key = row.get("increment_id") or row.get("item_id")
        add_item(order_key, row.get("sku"), row.get("qty_ordered"), row.get("price"))
    return order_items


def load_payments(ds5, orders_map):
    payments = []
    seen_orders = set()
    for row in ds5:
        if len(payments) >= MAX_ROWS:
            break
        order_key = row.get("increment_id") or row.get("item_id")
        if not order_key or order_key in seen_orders:
            continue
        order = orders_map.get(order_key)
        if not order:
            continue
        payments.append(
            Payment(
                payment_type=row.get("payment_method") or "unknown",
                payment_value=parse_decimal(row.get("grand_total") or row.get("price"), default=Decimal("0.0")),
                order=order,
            )
        )
        seen_orders.add(order_key)
    return payments


def load_reviews(ds6, products_map):
    reviews = []
    for row in ds6:
        if len(reviews) >= MAX_ROWS:
            break
        product = products_map.get(str(row.get("product_id")).strip())
        if not product:
            product = next(iter(products_map.values()), None)
        if not product:
            continue
        rating = parse_int(row.get("star_rating"), default=0)
        sentiment = "Positive" if rating >= 4 else "Neutral" if rating == 3 else "Negative"
        reviews.append(
            Review(
                comment=row.get("review_body") or row.get("review_headline"),
                rating=rating,
                sentiment=sentiment,
                date=parse_date(row.get("review_date")) or datetime.date.today(),
                product=product,
            )
        )
    return reviews


def load_customer_profiles(ds2, users_map):
    profiles = []
    for row in ds2:
        if len(profiles) >= MAX_ROWS:
            break
        customer_id = str(row.get("customer_id") or "").strip()
        user = users_map.get(customer_id)
        if not user:
            continue
        profiles.append(
            CustomerProfile(
                age=parse_int(row.get("age")),
                city=row.get("city"),
                membership_type=row.get("membership_type"),
                user=user,
            )
        )
    return profiles


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True)
    email = Column(String(255), unique=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    role_type = Column(String(50), nullable=False)
    gender = Column(String(50))
    profile = relationship("CustomerProfile", back_populates="user", uselist=False)
    stores = relationship("Store", back_populates="owner")
    orders = relationship("Order", back_populates="user")


class Category(Base):
    __tablename__ = "categories"

    id = Column(Integer, primary_key=True)
    name = Column(String(255), unique=True, nullable=False)
    parent_id = Column(Integer, ForeignKey("categories.id"), nullable=True)
    products = relationship("Product", back_populates="category")


class Store(Base):
    __tablename__ = "stores"

    id = Column(Integer, primary_key=True)
    name = Column(String(255), nullable=False)
    status = Column(String(50))
    owner_id = Column(Integer, ForeignKey("users.id"))
    owner = relationship("User", back_populates="stores")
    products = relationship("Product", back_populates="store")


class Product(Base):
    __tablename__ = "products"

    id = Column(Integer, primary_key=True)
    sku = Column(String(255), unique=True)
    name = Column(String(255), nullable=False)
    description = Column(Text)
    unit_price = Column(Numeric(12, 2), nullable=False)
    stock_quantity = Column(Integer)
    category_id = Column(Integer, ForeignKey("categories.id"))
    store_id = Column(Integer, ForeignKey("stores.id"))
    icon = Column(String(1024))
    category = relationship("Category", back_populates="products")
    store = relationship("Store", back_populates="products")
    reviews = relationship("Review", back_populates="product")


class Shipment(Base):
    __tablename__ = "shipments"

    id = Column(Integer, primary_key=True)
    warehouse_block = Column(String(50))
    mode_of_shipment = Column(String(100))
    reaching_on_time = Column(Integer)
    product_importance = Column(String(50))
    order = relationship("Order", back_populates="shipment", uselist=False)


class Order(Base):
    __tablename__ = "orders"

    id = Column(Integer, primary_key=True)
    order_number = Column(String(255))
    order_date = Column(DateTime)
    grand_total = Column(Numeric(12, 2))
    status = Column(String(255))
    user_id = Column(Integer, ForeignKey("users.id"))
    shipment_id = Column(Integer, ForeignKey("shipments.id"))
    user = relationship("User", back_populates="orders")
    shipment = relationship("Shipment", back_populates="order")
    items = relationship("OrderItem", back_populates="order")
    payments = relationship("Payment", back_populates="order")


class OrderItem(Base):
    __tablename__ = "order_items"

    id = Column(Integer, primary_key=True)
    order_id = Column(Integer, ForeignKey("orders.id"))
    product_id = Column(Integer, ForeignKey("products.id"))
    quantity = Column(Integer)
    price = Column(Numeric(12, 2), nullable=False)
    order = relationship("Order", back_populates="items")
    product = relationship("Product")


class Payment(Base):
    __tablename__ = "payments"

    id = Column(Integer, primary_key=True)
    payment_type = Column(String(255))
    payment_value = Column(Numeric(12, 2))
    order_id = Column(Integer, ForeignKey("orders.id"))
    order = relationship("Order", back_populates="payments")


class Review(Base):
    __tablename__ = "reviews"

    id = Column(Integer, primary_key=True)
    comment = Column(Text)
    rating = Column(Integer)
    sentiment = Column(String(50))
    date = Column(Date)
    product_id = Column(Integer, ForeignKey("products.id"))
    product = relationship("Product", back_populates="reviews")


class CustomerProfile(Base):
    __tablename__ = "customer_profiles"

    id = Column(Integer, primary_key=True)
    age = Column(Integer)
    city = Column(String(255))
    membership_type = Column(String(255))
    user_id = Column(Integer, ForeignKey("users.id"))
    user = relationship("User", back_populates="profile")


def assign_shipments_to_orders(orders, shipments):
    for i, order in enumerate(orders):
        if i < len(shipments):
            order.shipment = shipments[i]


def main():
    engine = create_engine(get_database_url(), echo=False, future=True)
    Session = sessionmaker(bind=engine)
    Base.metadata.create_all(engine)

    ds1 = read_dataset("ds1.csv", delimiter=",")
    ds2 = read_dataset("ds2.csv", delimiter=",")
    ds3 = read_dataset("ds3.csv", delimiter=",")
    ds4 = read_dataset("ds4.csv", delimiter=",")
    ds5 = read_dataset("ds5.csv", delimiter=",")
    ds6 = read_dataset("ds6.tsv", delimiter="\t")

    users, users_map, corporate_user = load_users(ds2, ds5, ds1)
    categories, categories_map = load_categories(ds4, ds5, ds6)
    stores = load_stores(corporate_user)
    products, products_map = load_products(ds1, ds4, ds5, ds6, categories_map, stores[0])
    shipments = load_shipments(ds3)
    orders, orders_map = load_orders(ds1, ds4, ds5, users_map)
    order_items = load_order_items(ds1, ds5, orders_map, products_map)
    payments = load_payments(ds5, orders_map)
    reviews = load_reviews(ds6, products_map)
    profiles = load_customer_profiles(ds2, users_map)

    assign_shipments_to_orders(orders, shipments)

    with Session() as session:
        session.add_all(users)
        session.add_all(categories)
        session.add_all(stores)
        session.add_all(products)
        session.add_all(shipments)
        session.add_all(orders)
        session.add_all(order_items)
        session.add_all(payments)
        session.add_all(reviews)
        session.add_all(profiles)
        session.commit()

    print("ETL tamamlandı. Tablo satırları: ")
    print(f"users={min(len(users), MAX_ROWS)}")
    print(f"categories={len(categories)}")
    print(f"stores={len(stores)}")
    print(f"products={min(len(products), MAX_ROWS)}")
    print(f"shipments={min(len(shipments), MAX_ROWS)}")
    print(f"orders={min(len(orders), MAX_ROWS)}")
    print(f"order_items={min(len(order_items), MAX_ROWS)}")
    print(f"payments={min(len(payments), MAX_ROWS)}")
    print(f"reviews={min(len(reviews), MAX_ROWS)}")
    print(f"customer_profiles={min(len(profiles), MAX_ROWS)}")


if __name__ == "__main__":
    main()
