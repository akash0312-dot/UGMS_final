from app import create_app
from models import (
    DEFAULT_WORKER_CATEGORY_NAMES,
    Product,
    Supplier,
    User,
    Worker,
    WorkerCategory,
    db,
)


def _ensure_worker_categories():
    for name in DEFAULT_WORKER_CATEGORY_NAMES:
        if not WorkerCategory.query.filter(
            db.func.lower(WorkerCategory.name) == name.lower()
        ).first():
            db.session.add(WorkerCategory(name=name))
    db.session.flush()


def _category_id_by_name(name: str):
    cat = WorkerCategory.query.filter(
        db.func.lower(WorkerCategory.name) == name.lower()
    ).first()
    return cat.id if cat else None


def seed():
    app = create_app()
    with app.app_context():
        # Ensure tables exist
        db.create_all()

        _ensure_worker_categories()

        # ----- Admin user -----
        admin_email = "admin@ugms.com"
        admin = User.query.filter_by(email=admin_email).first()
        if not admin:
            admin = User(name="Store Owner", email=admin_email, role="admin")
            admin.set_password("admin123")
            db.session.add(admin)
            print(f"Created admin user: {admin_email} / admin123")

        # ----- Suppliers (agencies) -----
        if Supplier.query.count() == 0:
            supplier1 = Supplier(
                name="FreshDairy Supplies",
                contact_person="Anita Verma",
                phone="9800000001",
                email="anita@freshdairy.com",
                address="23 Milk Colony, Pune",
            )
            supplier2 = Supplier(
                name="HealthyGrain Distributors",
                contact_person="Mohan Das",
                phone="9800000002",
                email="mohan@healthygrain.com",
                address="45 Market Road, Chennai",
            )
            supplier3 = Supplier(
                name="VeggieLand Farms",
                contact_person="Suresh Babu",
                phone="9800000003",
                email="suresh@veggieland.com",
                address="67 Farm Road, Bangalore",
            )
            db.session.add_all([supplier1, supplier2, supplier3])
            db.session.flush()
            print("Created 3 suppliers (agencies).")
        else:
            supplier1, supplier2, supplier3 = Supplier.query.limit(3).all()

        # ----- Products + inventory -----
        if Product.query.count() == 0:
            products = [
                dict(name="Organic Milk 1L", category="Dairy", price=70, stock=15, min_threshold=10, image="🥛", supplier=supplier1),
                dict(name="Brown Bread Loaf", category="Bakery", price=45, stock=8, min_threshold=10, image="🍞", supplier=supplier1),
                dict(name="Free-range Eggs (12pc)", category="Dairy", price=85, stock=20, min_threshold=8, image="🥚", supplier=supplier1),
                dict(name="Basmati Rice 5kg", category="Grains", price=520, stock=30, min_threshold=12, image="🍚", supplier=supplier2),
                dict(name="Whole Wheat Flour 5kg", category="Grains", price=260, stock=18, min_threshold=10, image="🌾", supplier=supplier2),
                dict(name="Quinoa 1kg", category="Grains", price=320, stock=6, min_threshold=10, image="🥣", supplier=supplier2),
                dict(name="Olive Oil 1L", category="Oils", price=480, stock=12, min_threshold=5, image="🫒", supplier=supplier2),
                dict(name="Green Tea 50 Bags", category="Beverages", price=210, stock=25, min_threshold=8, image="🍵", supplier=supplier2),
                dict(name="Organic Tomatoes 1kg", category="Vegetables", price=55, stock=40, min_threshold=10, image="🍅", supplier=supplier3),
                dict(name="Organic Potatoes 1kg", category="Vegetables", price=40, stock=9, min_threshold=12, image="🥔", supplier=supplier3),
            ]

            for idx, p in enumerate(products, start=1):
                product = Product(
                    name=p["name"],
                    sku=f"UGMS-{idx:03d}",
                    category=p["category"],
                    image_url=p["image"],
                    sale_price=p["price"],
                    cost_price=p["price"] * 0.75,
                    stock_qty=p["stock"],
                    min_threshold=p["min_threshold"],
                    primary_supplier=p["supplier"],
                )
                db.session.add(product)

            print("Created 10 sample products with inventory and supplier links.")

        # ----- Workers -----
        if Worker.query.count() == 0:
            workers = [
                dict(
                    code="W001",
                    name="Rahul Sharma",
                    role="Cashier",
                    category="picker",
                    experience=3,
                    phone="9876543210",
                    salary=18000,
                    password="rahul123",
                ),
                dict(
                    code="W002",
                    name="Priya Patel",
                    role="Storekeeper",
                    category="stock filler",
                    experience=5,
                    phone="9876543211",
                    salary=22000,
                    password="priya123",
                ),
                dict(
                    code="W003",
                    name="Amit Kumar",
                    role="Delivery",
                    category="delivery person",
                    experience=2,
                    phone="9876543212",
                    salary=15000,
                    password="amit123",
                ),
            ]
            for w in workers:
                cid = _category_id_by_name(w["category"])
                worker = Worker(
                    worker_code=w["code"],
                    name=w["name"],
                    role=w["role"],
                    category_id=cid,
                    experience_years=w["experience"],
                    phone=w["phone"],
                    salary=w["salary"],
                )
                worker.set_password(w["password"])
                db.session.add(worker)

            print("Created 3 sample workers.")

        db.session.commit()
        print("UGMS seed completed.")


if __name__ == "__main__":
    seed()

