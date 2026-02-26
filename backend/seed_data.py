from app import create_app
from models import db, Product, Supplier


def seed():
  app = create_app()
  with app.app_context():
    # Only seed if there are no products yet
    if Product.query.first():
      print("Products already exist, skipping seeding.")
      return

    # Create suppliers (agencies)
    supplier1 = Supplier(
      name="FreshGrain Distributors",
      contact_person="Mohan Das",
      phone="9800000001",
      email="mohan@freshgrain.com",
      address="45 Market Road, Chennai",
    )
    supplier2 = Supplier(
      name="DairyFresh Co.",
      contact_person="Anita Verma",
      phone="9800000004",
      email="anita@dairyfresh.com",
      address="23 Milk Colony, Pune",
    )
    supplier3 = Supplier(
      name="VeggieLand Farms",
      contact_person="Suresh Babu",
      phone="9800000005",
      email="suresh@veggieland.com",
      address="67 Farm Road, Bangalore",
    )

    db.session.add_all([supplier1, supplier2, supplier3])
    db.session.flush()  # assign IDs

    products = [
      # min_threshold > stock_qty for low stock simulation
      dict(name="Basmati Rice 1kg", category="Grains", price=120, stock=5, min_threshold=10, image_url="🍚", supplier=supplier1),
      dict(name="Whole Wheat Flour 5kg", category="Grains", price=220, stock=8, min_threshold=15, image_url="🌾", supplier=supplier1),

      dict(name="Toor Dal 1kg", category="Pulses", price=95, stock=40, min_threshold=8, image_url="🫘", supplier=supplier1),
      dict(name="Sunflower Oil 1L", category="Oils", price=180, stock=30, min_threshold=5, image_url="🫒", supplier=supplier1),
      dict(name="Sugar 1kg", category="Essentials", price=42, stock=100, min_threshold=20, image_url="🍬", supplier=supplier1),
      dict(name="Tea Powder 500g", category="Beverages", price=220, stock=25, min_threshold=5, image_url="🍵", supplier=supplier1),
      dict(name="Milk 1L", category="Dairy", price=60, stock=12, min_threshold=10, image_url="🥛", supplier=supplier2),
      dict(name="Bread Loaf", category="Bakery", price=35, stock=20, min_threshold=5, image_url="🍞", supplier=supplier2),
      dict(name="Eggs (12pc)", category="Dairy", price=72, stock=15, min_threshold=5, image_url="🥚", supplier=supplier2),
      dict(name="Tomato 1kg", category="Vegetables", price=30, stock=60, min_threshold=10, image_url="🍅", supplier=supplier3),
    ]

    for idx, p in enumerate(products, start=1):
      product = Product(
        name=p["name"],
        sku=f"P{idx:03d}",
        category=p["category"],
        image_url=p["image_url"],
        sale_price=p["price"],
        cost_price=p["price"] * 0.75,  # simple cost assumption
        stock_qty=p["stock"],
        min_threshold=p["min_threshold"],
        primary_supplier=p["supplier"],
      )
      db.session.add(product)

    db.session.commit()
    print("Seeded sample suppliers and products.")


if __name__ == "__main__":
  seed()

