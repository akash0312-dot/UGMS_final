import pymysql
pymysql.install_as_MySQLdb()
from datetime import date, datetime

from flask import Flask, jsonify, request
from flask_jwt_extended import (
    JWTManager,
    create_access_token,
    get_jwt_identity,
    jwt_required,
)
from flask_migrate import Migrate
from flask_cors import CORS

from config import get_config
from models import (
    db,
    User,
    Product,
    Order,
    OrderItem,
    Worker,
    WorkerAttendance,
    SalaryPayment,
)


def create_app() -> Flask:
    app = Flask(__name__)
    cfg = get_config()
    app.config.from_object(cfg)

    # Allow frontend (e.g. Vite on http://localhost:5173) to call the API
    CORS(app, resources={r"/api/*": {"origins": "*"}})

    db.init_app(app)
    JWTManager(app)
    Migrate(app, db)

    @app.route("/api/health", methods=["GET"])
    def health():
        return jsonify({"status": "ok"}), 200

    # ---------- Auth (Admin / Worker) ----------

    @app.route("/api/auth/login", methods=["POST"])
    def login():
        data = request.get_json() or {}
        email = data.get("email")
        password = data.get("password")

        if not email or not password:
            return jsonify({"message": "Email and password required"}), 400

        user = User.query.filter_by(email=email).first()
        if not user or not user.check_password(password):
            return jsonify({"message": "Invalid credentials"}), 401

        access_token = create_access_token(
            identity={"id": user.id, "role": user.role, "name": user.name}
        )
        return jsonify({"access_token": access_token}), 200

    @app.route("/api/auth/me", methods=["GET"])
    @jwt_required()
    def me():
        return jsonify(get_jwt_identity()), 200

    # ---------- Products ----------

    @app.route("/api/products", methods=["GET"])
    def list_products():
        """
        Public endpoint for customer product dashboard.
        """
        products = Product.query.all()
        result = []
        for p in products:
            result.append(
                {
                    "id": p.id,
                    "name": p.name,
                    "sku": p.sku,
                    "sale_price": float(p.sale_price),
                    "cost_price": float(p.cost_price) if p.cost_price is not None else None,
                    "stock_qty": p.stock_qty,
                    "min_threshold": p.min_threshold,
                    "is_low_stock": p.stock_qty <= p.min_threshold,
                }
            )
        return jsonify(result), 200

    @app.route("/api/admin/products", methods=["POST"])
    @jwt_required()
    def create_product():
        identity = get_jwt_identity() or {}
        if identity.get("role") != "admin":
            return jsonify({"message": "Admin access required"}), 403

        data = request.get_json() or {}
        required = ["name", "sku", "sale_price", "cost_price", "stock_qty"]
        if not all(field in data for field in required):
            return jsonify({"message": "Missing required product fields"}), 400

        product = Product(
            name=data["name"],
            sku=data["sku"],
            sale_price=data["sale_price"],
            cost_price=data["cost_price"],
            stock_qty=data.get("stock_qty", 0),
            min_threshold=data.get("min_threshold", 5),
        )
        db.session.add(product)
        db.session.commit()

        return jsonify({"id": product.id}), 201

    # Simple unauthenticated endpoints for inventory management
    # (for now, since frontend owner login is not wired to JWT yet).

    @app.route("/api/products", methods=["POST"])
    def create_product_public():
        data = request.get_json() or {}
        name = data.get("name")
        price = data.get("sale_price")
        stock_qty = data.get("stock_qty", 0)
        min_threshold = data.get("min_threshold", 5)
        category = data.get("category")
        image_url = data.get("image_url")

        if not name or price is None:
            return jsonify({"message": "name and sale_price are required"}), 400

        # Generate a simple SKU
        base_sku = data.get("sku") or name.upper().replace(" ", "-")[:20]
        sku = f"{base_sku}-{int(datetime.utcnow().timestamp())}"

        product = Product(
            name=name,
            sku=sku,
            category=category,
            image_url=image_url,
            sale_price=price,
            cost_price=data.get("cost_price", price * 0.75),
            stock_qty=stock_qty,
            min_threshold=min_threshold,
        )
        db.session.add(product)
        db.session.commit()

        return jsonify({"id": product.id}), 201

    @app.route("/api/products/<int:product_id>/restock", methods=["POST"])
    def restock_product_public(product_id: int):
        data = request.get_json() or {}
        qty = int(data.get("quantity", 0))
        if qty <= 0:
            return jsonify({"message": "quantity must be > 0"}), 400

        product = Product.query.get(product_id)
        if not product:
            return jsonify({"message": "Product not found"}), 404

        cost_price = data.get("cost_price")
        if cost_price is not None:
            try:
                cost_price = float(cost_price)
            except (TypeError, ValueError):
                return jsonify({"message": "cost_price must be a number"}), 400

            # Weighted average cost: (old_value + new_value) / new_total_qty
            old_qty = product.stock_qty
            old_cost = float(product.cost_price or 0) * old_qty
            new_cost = cost_price * qty
            new_total_qty = old_qty + qty
            if new_total_qty > 0:
                product.cost_price = (old_cost + new_cost) / new_total_qty
            else:
                product.cost_price = cost_price

        product.stock_qty += qty
        db.session.commit()

        return jsonify(
            {
                "id": product.id,
                "stock_qty": product.stock_qty,
                "cost_price": float(product.cost_price) if product.cost_price is not None else None,
            }
        ), 200

    # ---------- Orders & Stock Management ----------

    @app.route("/api/orders", methods=["POST"])
    def create_order():
        """
        Customer checkout endpoint.

        Expected payload:
        {
          "customer_name": "...",
          "payment_method": "cash|card|upi",
          "items": [
            {"product_id": 1, "quantity": 2},
            ...
          ]
        }
        """
        data = request.get_json() or {}
        items_data = data.get("items", [])
        if not items_data:
            return jsonify({"message": "At least one item is required"}), 400

        # Validate stock
        product_map = {}
        for item in items_data:
            product_id = item.get("product_id")
            qty = int(item.get("quantity", 0))
            if not product_id or qty <= 0:
                return jsonify({"message": "Invalid item in order"}), 400

            product = Product.query.get(product_id)
            if not product:
                return jsonify({"message": f"Product {product_id} not found"}), 404
            if product.stock_qty < qty:
                return jsonify(
                    {
                        "message": f"Insufficient stock for {product.name}",
                        "available": product.stock_qty,
                    }
                ), 400
            product_map[product_id] = product

        order = Order(
            customer_name=data.get("customer_name"),
            payment_method=data.get("payment_method"),
        )
        db.session.add(order)

        total = 0
        for item in items_data:
            product = product_map[item["product_id"]]
            qty = int(item["quantity"])
            line_total = float(product.sale_price) * qty
            total += line_total

            # Deduct stock
            product.stock_qty -= qty

            order_item = OrderItem(
                order=order,
                product=product,
                quantity=qty,
                unit_price=product.sale_price,
                line_total=line_total,
            )
            db.session.add(order_item)

        order.total_amount = total
        db.session.commit()

        return jsonify({"order_id": order.id, "total_amount": float(total)}), 201

    # ---------- Worker Management (basic) ----------

    @app.route("/api/admin/workers", methods=["POST"])
    @jwt_required()
    def create_worker():
        identity = get_jwt_identity() or {}
        if identity.get("role") != "admin":
            return jsonify({"message": "Admin access required"}), 403

        data = request.get_json() or {}
        required = ["worker_code", "name", "salary"]
        if not all(field in data for field in required):
            return jsonify({"message": "Missing required worker fields"}), 400

        worker = Worker(
            worker_code=data["worker_code"],
            name=data["name"],
            role=data.get("role"),
            experience_years=data.get("experience_years", 0),
            phone=data.get("phone"),
            salary=data["salary"],
        )
        db.session.add(worker)
        db.session.commit()
        return jsonify({"id": worker.id}), 201

    @app.route("/api/admin/workers", methods=["GET"])
    @jwt_required()
    def list_workers():
        identity = get_jwt_identity() or {}
        if identity.get("role") != "admin":
            return jsonify({"message": "Admin access required"}), 403

        workers = Worker.query.all()
        result = []
        for w in workers:
            result.append(
                {
                    "id": w.id,
                    "worker_code": w.worker_code,
                    "name": w.name,
                    "role": w.role,
                    "experience_years": w.experience_years,
                    "phone": w.phone,
                    "salary": float(w.salary),
                    "is_active": w.is_active,
                }
            )
        return jsonify(result), 200

    # ---------- Attendance ----------

    @app.route("/api/admin/attendance", methods=["POST"])
    @jwt_required()
    def mark_attendance():
        identity = get_jwt_identity() or {}
        if identity.get("role") != "admin":
            return jsonify({"message": "Admin access required"}), 403

        data = request.get_json() or {}
        worker_id = data.get("worker_id")
        status = data.get("status")
        att_date_str = data.get("date")  # YYYY-MM-DD

        if not worker_id or not status:
            return jsonify({"message": "worker_id and status are required"}), 400

        if att_date_str:
            att_date = datetime.strptime(att_date_str, "%Y-%m-%d").date()
        else:
            att_date = date.today()

        record = WorkerAttendance(
            worker_id=worker_id,
            status=status,
            date=att_date,
        )
        db.session.add(record)
        db.session.commit()
        return jsonify({"id": record.id}), 201

    # ---------- Salary Payments ----------

    @app.route("/api/admin/salaries", methods=["POST"])
    @jwt_required()
    def record_salary_payment():
        identity = get_jwt_identity() or {}
        if identity.get("role") != "admin":
            return jsonify({"message": "Admin access required"}), 403

        data = request.get_json() or {}
        required = ["worker_id", "month", "year", "amount"]
        if not all(field in data for field in required):
            return jsonify({"message": "Missing salary payment fields"}), 400

        payment = SalaryPayment(
            worker_id=data["worker_id"],
            month=data["month"],
            year=data["year"],
            amount=data["amount"],
        )
        db.session.add(payment)
        db.session.commit()
        return jsonify({"id": payment.id}), 201

    # ---------- Reporting ----------

    @app.route("/api/admin/reports/daily-sales", methods=["GET"])
    @jwt_required()
    def daily_sales():
        identity = get_jwt_identity() or {}
        if identity.get("role") != "admin":
            return jsonify({"message": "Admin access required"}), 403

        date_str = request.args.get("date")
        if date_str:
            target_date = datetime.strptime(date_str, "%Y-%m-%d").date()
        else:
            target_date = date.today()

        start_dt = datetime.combine(target_date, datetime.min.time())
        end_dt = datetime.combine(target_date, datetime.max.time())

        orders = (
            Order.query.filter(Order.created_at >= start_dt, Order.created_at <= end_dt)
            .order_by(Order.created_at.asc())
            .all()
        )

        total_revenue = sum(float(o.total_amount) for o in orders)
        top_products = {}
        for o in orders:
            for item in o.items:
                key = item.product_id
                top_products.setdefault(
                    key,
                    {
                        "product_id": item.product_id,
                        "product_name": item.product.name,
                        "quantity": 0,
                        "revenue": 0.0,
                    },
                )
                top_products[key]["quantity"] += item.quantity
                top_products[key]["revenue"] += float(item.line_total)

        return jsonify(
            {
                "date": target_date.isoformat(),
                "total_revenue": total_revenue,
                "orders_count": len(orders),
                "top_products": sorted(
                    top_products.values(),
                    key=lambda x: x["revenue"],
                    reverse=True,
                ),
            }
        ), 200

    @app.route("/api/admin/reports/monthly-summary", methods=["GET"])
    @jwt_required()
    def monthly_summary():
        identity = get_jwt_identity() or {}
        if identity.get("role") != "admin":
            return jsonify({"message": "Admin access required"}), 403

        year = int(request.args.get("year", date.today().year))
        month = int(request.args.get("month", date.today().month))

        start_dt = datetime(year, month, 1)
        if month == 12:
            end_dt = datetime(year + 1, 1, 1)
        else:
            end_dt = datetime(year, month + 1, 1)

        orders = (
            Order.query.filter(Order.created_at >= start_dt, Order.created_at < end_dt)
            .all()
        )
        total_revenue = sum(float(o.total_amount) for o in orders)

        salaries = (
            SalaryPayment.query.filter_by(year=year, month=month).all()
        )
        total_salaries = sum(float(s.amount) for s in salaries)

        # In a more detailed system, you would sum purchase costs per month as well.
        total_purchase_costs = 0.0

        net_profit = total_revenue - total_salaries - total_purchase_costs

        return jsonify(
            {
                "year": year,
                "month": month,
                "total_revenue": total_revenue,
                "total_salaries": total_salaries,
                "total_purchase_costs": total_purchase_costs,
                "net_profit": net_profit,
            }
        ), 200

    return app


if __name__ == "__main__":
    app = create_app()
    app.run(host="0.0.0.0", port=5000, debug=True)

