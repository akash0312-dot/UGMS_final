from datetime import datetime, date

from flask_sqlalchemy import SQLAlchemy
from werkzeug.security import generate_password_hash, check_password_hash


db = SQLAlchemy()


class User(db.Model):
    __tablename__ = "users"

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(120), nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False, index=True)
    password_hash = db.Column(db.String(255), nullable=False)
    role = db.Column(db.String(20), nullable=False, default="admin")  # admin or worker
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def set_password(self, password: str) -> None:
        self.password_hash = generate_password_hash(password)

    def check_password(self, password: str) -> bool:
        return check_password_hash(self.password_hash, password)


class Supplier(db.Model):
    __tablename__ = "suppliers"

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(150), nullable=False)
    contact_person = db.Column(db.String(120))
    phone = db.Column(db.String(50))
    email = db.Column(db.String(120))
    address = db.Column(db.Text)

    products = db.relationship("Product", back_populates="primary_supplier")


class Product(db.Model):
    __tablename__ = "products"

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(150), nullable=False)
    sku = db.Column(db.String(100), unique=True, nullable=False)
    category = db.Column(db.String(100), nullable=True)
    image_url = db.Column(db.String(255), nullable=True)
    sale_price = db.Column(db.Numeric(10, 2), nullable=False)
    cost_price = db.Column(db.Numeric(10, 2), nullable=False)
    stock_qty = db.Column(db.Integer, nullable=False, default=0)
    min_threshold = db.Column(db.Integer, nullable=False, default=5)

    supplier_id = db.Column(db.Integer, db.ForeignKey("suppliers.id"))
    primary_supplier = db.relationship("Supplier", back_populates="products")

    order_items = db.relationship("OrderItem", back_populates="product")


class WorkerCategory(db.Model):
    __tablename__ = "worker_categories"

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), unique=True, nullable=False)

    workers = db.relationship("Worker", back_populates="category")


# Default roles shown in admin worker dropdown (created automatically if missing).
DEFAULT_WORKER_CATEGORY_NAMES = (
    "HR",
    "picker",
    "accountant",
    "loadman",
    "stock filler",
    "delivery person",
)


def ensure_default_worker_categories() -> None:
    """Idempotently add standard worker roles to the database."""
    added = False
    for name in DEFAULT_WORKER_CATEGORY_NAMES:
        if not WorkerCategory.query.filter(
            db.func.lower(WorkerCategory.name) == name.lower()
        ).first():
            db.session.add(WorkerCategory(name=name))
            added = True
    if added:
        db.session.commit()


class Worker(db.Model):
    __tablename__ = "workers"

    id = db.Column(db.Integer, primary_key=True)
    worker_code = db.Column(db.String(50), unique=True, nullable=False)
    name = db.Column(db.String(150), nullable=False)
    role = db.Column(db.String(100))
    category_id = db.Column(db.Integer, db.ForeignKey("worker_categories.id"), nullable=True)
    category = db.relationship("WorkerCategory", back_populates="workers")
    password_hash = db.Column(db.String(255), nullable=True)
    experience_years = db.Column(db.Float, default=0)
    phone = db.Column(db.String(50))
    salary = db.Column(db.Numeric(10, 2), nullable=False, default=0)
    days_present = db.Column(db.Integer, nullable=False, default=0)
    days_absent = db.Column(db.Integer, nullable=False, default=0)
    joining_date = db.Column(db.Date, default=date.today)
    is_active = db.Column(db.Boolean, default=True)

    attendances = db.relationship("WorkerAttendance", back_populates="worker")
    salary_payments = db.relationship("SalaryPayment", back_populates="worker")

    def set_password(self, password: str) -> None:
        self.password_hash = generate_password_hash(password)

    def check_password(self, password: str) -> bool:
        if not self.password_hash:
            return False
        return check_password_hash(self.password_hash, password)


class WorkerAttendance(db.Model):
    __tablename__ = "worker_attendance"

    id = db.Column(db.Integer, primary_key=True)
    worker_id = db.Column(db.Integer, db.ForeignKey("workers.id"), nullable=False)
    date = db.Column(db.Date, nullable=False, index=True)
    status = db.Column(db.String(20), nullable=False)  # Present / Absent / Leave

    worker = db.relationship("Worker", back_populates="attendances")


class SalaryPayment(db.Model):
    __tablename__ = "salary_payments"

    id = db.Column(db.Integer, primary_key=True)
    worker_id = db.Column(db.Integer, db.ForeignKey("workers.id"), nullable=False)
    month = db.Column(db.Integer, nullable=False)
    year = db.Column(db.Integer, nullable=False)
    amount = db.Column(db.Numeric(10, 2), nullable=False)
    paid_date = db.Column(db.Date, default=date.today)

    worker = db.relationship("Worker", back_populates="salary_payments")


class Order(db.Model):
    __tablename__ = "orders"

    id = db.Column(db.Integer, primary_key=True)
    customer_name = db.Column(db.String(150))
    created_at = db.Column(db.DateTime, default=datetime.utcnow, index=True)
    payment_method = db.Column(db.String(50))
    total_amount = db.Column(db.Numeric(10, 2), nullable=False, default=0)

    items = db.relationship("OrderItem", back_populates="order", cascade="all, delete-orphan")


class OrderItem(db.Model):
    __tablename__ = "order_items"

    id = db.Column(db.Integer, primary_key=True)
    order_id = db.Column(db.Integer, db.ForeignKey("orders.id"), nullable=False)
    product_id = db.Column(db.Integer, db.ForeignKey("products.id"), nullable=False)
    quantity = db.Column(db.Integer, nullable=False)
    unit_price = db.Column(db.Numeric(10, 2), nullable=False)
    line_total = db.Column(db.Numeric(10, 2), nullable=False)

    order = db.relationship("Order", back_populates="items")
    product = db.relationship("Product", back_populates="order_items")


class Purchase(db.Model):
    __tablename__ = "purchases"

    id = db.Column(db.Integer, primary_key=True)
    supplier_id = db.Column(db.Integer, db.ForeignKey("suppliers.id"), nullable=False)
    purchase_date = db.Column(db.Date, default=date.today)
    total_cost = db.Column(db.Numeric(10, 2), nullable=False, default=0)

    supplier = db.relationship("Supplier")


class LeaveRequest(db.Model):
    __tablename__ = "leave_requests"

    id = db.Column(db.Integer, primary_key=True)
    worker_id = db.Column(db.Integer, db.ForeignKey("workers.id"), nullable=False)
    date = db.Column(db.Date, nullable=False, index=True)
    reason = db.Column(db.Text, nullable=False)
    status = db.Column(db.String(20), default="Pending") # Pending, Approved, Rejected
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    worker = db.relationship("Worker", backref=db.backref("leave_requests", lazy=True))


class SalaryChangeRequest(db.Model):
    __tablename__ = "salary_change_requests"

    id = db.Column(db.Integer, primary_key=True)
    worker_id = db.Column(db.Integer, db.ForeignKey("workers.id"), nullable=False)
    requested_by_role = db.Column(db.String(20))
    proposed_salary = db.Column(db.Numeric(10, 2), nullable=True)
    proposed_bonus = db.Column(db.Numeric(10, 2), nullable=True)
    status = db.Column(db.String(20), default="Pending") # Pending, Approved, Rejected
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    worker = db.relationship("Worker", backref="salary_change_requests")


class Message(db.Model):
    __tablename__ = "messages"

    id = db.Column(db.Integer, primary_key=True)
    sender_worker_id = db.Column(db.Integer, db.ForeignKey("workers.id"), nullable=True)
    sender_role = db.Column(db.String(20), nullable=False)
    receiver_worker_id = db.Column(db.Integer, db.ForeignKey("workers.id"), nullable=True)
    receiver_role = db.Column(db.String(20), nullable=False)
    content = db.Column(db.Text, nullable=False)
    is_read = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    sender = db.relationship("Worker", foreign_keys=[sender_worker_id])
    receiver = db.relationship("Worker", foreign_keys=[receiver_worker_id])

