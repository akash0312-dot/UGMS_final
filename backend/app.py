import pymysql
pymysql.install_as_MySQLdb()
from datetime import date, datetime

from flask import Flask, jsonify, request
from flask_jwt_extended import (
    JWTManager,
    create_access_token,
    get_jwt_identity,
    get_jwt,
    jwt_required,
)
from flask_migrate import Migrate
from flask_cors import CORS

from config import get_config
from models import (
    LeaveRequest,
    Message,
    Order,
    OrderItem,
    Product,
    SalaryChangeRequest,
    SalaryPayment,
    Supplier,
    User,
    Worker,
    WorkerAttendance,
    WorkerCategory,
    db,
    ensure_default_worker_categories,
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
            identity=str(user.id),
            additional_claims={"id": user.id, "role": user.role, "name": user.name}
        )
        return jsonify({"access_token": access_token}), 200

    @app.route("/api/auth/signup", methods=["POST"])
    def signup():
        """
        Create a new shop-owner/admin user and store in MySQL.

        Payload:
        {
          "name": "...",
          "email": "...",
          "password": "..."
        }
        """
        data = request.get_json() or {}
        name = (data.get("name") or "").strip()
        email = (data.get("email") or "").strip().lower()
        password = data.get("password")

        if not name or not email or not password:
            return jsonify({"message": "name, email and password are required"}), 400

        if len(password) < 6:
            return jsonify({"message": "Password must be at least 6 characters"}), 400

        existing = User.query.filter_by(email=email).first()
        if existing:
            return jsonify({"message": "Email already registered"}), 409

        user = User(name=name, email=email, role="admin")
        user.set_password(password)
        db.session.add(user)
        db.session.commit()

        access_token = create_access_token(
            identity=str(user.id),
            additional_claims={"id": user.id, "role": user.role, "name": user.name}
        )
        return jsonify({"access_token": access_token}), 201

    @app.route("/api/auth/me", methods=["GET"])
    @jwt_required()
    def me():
        return jsonify(get_jwt()), 200

    @app.route("/api/auth/worker/login", methods=["POST"])
    def worker_login():
        data = request.get_json() or {}
        worker_code = (data.get("worker_code") or data.get("staff_id") or "").strip()
        password = data.get("password")

        if not worker_code or not password:
            return jsonify({"message": "Staff ID and password required"}), 400

        worker = Worker.query.filter_by(worker_code=worker_code).first()
        if not worker or not worker.check_password(password):
            return jsonify({"message": "Invalid credentials"}), 401

        cat_name = worker.category.name if worker.category else None
        access_token = create_access_token(
            identity=str(worker.id),
            additional_claims={
                "id": worker.id,
                "role": "worker",
                "name": worker.name,
                "worker_code": worker.worker_code,
                "category_id": worker.category_id,
                "category_name": cat_name,
            }
        )
        return jsonify({"access_token": access_token}), 200

    # ---------- Worker categories ----------

    @app.route("/api/worker-categories", methods=["GET"])
    def list_worker_categories():
        ensure_default_worker_categories()
        cats = WorkerCategory.query.all()
        _defaults = ["Stock Filler", "Loader", "Delivery Person", "Picker", "HR"]
        order_map = {n.lower(): i for i, n in enumerate(_defaults)}
        cats.sort(key=lambda c: (order_map.get(c.name.lower(), 1_000), c.name.lower()))
        return jsonify([{"id": c.id, "name": c.name} for c in cats]), 200

    @app.route("/api/worker-categories", methods=["POST"])
    def create_worker_category():
        data = request.get_json() or {}
        name = (data.get("name") or "").strip()
        if not name:
            return jsonify({"message": "name is required"}), 400
        if WorkerCategory.query.filter(
            db.func.lower(WorkerCategory.name) == name.lower()
        ).first():
            return jsonify({"message": "Category already exists"}), 409
        cat = WorkerCategory(name=name)
        db.session.add(cat)
        db.session.commit()
        return jsonify({"id": cat.id, "name": cat.name}), 201

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
                    "category": p.category,
                    "image_url": p.image_url,
                    "sale_price": float(p.sale_price),
                    "cost_price": float(p.cost_price) if p.cost_price is not None else None,
                    "stock_qty": p.stock_qty,
                    "min_threshold": p.min_threshold,
                    "supplier_id": p.supplier_id,
                    "is_low_stock": p.stock_qty <= p.min_threshold,
                }
            )
        return jsonify(result), 200

    @app.route("/api/admin/products", methods=["POST"])
    @jwt_required()
    def create_product():
        identity = get_jwt() or {}
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
        supplier_id = data.get("supplier_id")

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
            supplier_id=supplier_id,
        )
        db.session.add(product)
        db.session.commit()

        return jsonify({"id": product.id}), 201

    @app.route("/api/products/<int:product_id>", methods=["PUT"])
    def update_product_public(product_id: int):
        data = request.get_json() or {}

        product = Product.query.get(product_id)
        if not product:
            return jsonify({"message": "Product not found"}), 404

        if "name" in data:
            product.name = data["name"]
        if "category" in data:
            product.category = data["category"]
        if "image_url" in data:
            product.image_url = data["image_url"]
        if "sale_price" in data:
            product.sale_price = data["sale_price"]
        if "cost_price" in data:
            product.cost_price = data["cost_price"]
        if "stock_qty" in data:
            product.stock_qty = data["stock_qty"]
        if "min_threshold" in data:
            product.min_threshold = data["min_threshold"]
        if "supplier_id" in data:
            product.supplier_id = data["supplier_id"]

        db.session.commit()

        return jsonify(
            {
                "id": product.id,
                "name": product.name,
                "sku": product.sku,
                "category": product.category,
                "image_url": product.image_url,
                "sale_price": float(product.sale_price),
                "cost_price": float(product.cost_price)
                if product.cost_price is not None
                else None,
                "stock_qty": product.stock_qty,
                "min_threshold": product.min_threshold,
            }
        ), 200

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

    def _serialize_worker(worker: Worker) -> dict:
        return {
            "id": worker.id,
            "worker_code": worker.worker_code,
            "name": worker.name,
            "role": worker.role,
            "category_id": worker.category_id,
            "category_name": worker.category.name if worker.category else None,
            "experience_years": worker.experience_years,
            "phone": worker.phone,
            "salary": float(worker.salary),
            "days_present": worker.days_present,
            "days_absent": worker.days_absent,
            "is_active": worker.is_active,
            "has_password": bool(worker.password_hash),
            "has_pending_salary_request": any(r.status == "Pending" for r in worker.salary_change_requests),
        }

    @app.route("/api/admin/workers", methods=["POST"])
    @jwt_required()
    def create_worker():
        identity = get_jwt() or {}
        if identity.get("role") != "admin":
            return jsonify({"message": "Admin access required"}), 403

        data = request.get_json() or {}
        worker_code = (data.get("worker_code") or "").strip()
        password = data.get("password")
        category_id = data.get("category_id")
        required = ["name", "salary"]
        if not all(field in data for field in required):
            return jsonify({"message": "Missing required worker fields"}), 400
        if not worker_code:
            return jsonify({"message": "worker_code (staff ID) is required"}), 400
        if not password or len(str(password)) < 6:
            return jsonify({"message": "password is required (min 6 characters)"}), 400
        if not category_id:
            return jsonify({"message": "category_id is required"}), 400
        if Worker.query.filter_by(worker_code=worker_code).first():
            return jsonify({"message": "Staff ID already in use"}), 409
        cat = WorkerCategory.query.get(category_id)
        if not cat:
            return jsonify({"message": "Invalid category"}), 400

        worker = Worker(
            worker_code=worker_code,
            name=data["name"],
            role=data.get("role"),
            category_id=category_id,
            experience_years=data.get("experience_years", 0),
            phone=data.get("phone"),
            salary=data["salary"],
            days_present=int(data.get("days_present", 0) or 0),
            days_absent=int(data.get("days_absent", 0) or 0),
        )
        worker.set_password(str(password))
        db.session.add(worker)
        db.session.commit()
        return jsonify(_serialize_worker(worker)), 201

    @app.route("/api/admin/workers", methods=["GET"])
    @jwt_required()
    def list_workers():
        identity = get_jwt() or {}
        if identity.get("role") != "admin":
            return jsonify({"message": "Admin access required"}), 403

        workers = Worker.query.all()
        return jsonify([_serialize_worker(w) for w in workers]), 200

    # Temporary unauthenticated endpoints used by the current frontend
    # until owner login is fully wired to JWT.

    @app.route("/api/workers", methods=["GET"])
    def list_workers_public():
        workers = Worker.query.all()
        return jsonify([_serialize_worker(w) for w in workers]), 200

    @app.route("/api/workers", methods=["POST"])
    def create_worker_public():
        data = request.get_json() or {}
        name = data.get("name")
        salary = data.get("salary")
        worker_code = (data.get("worker_code") or "").strip()
        password = data.get("password")
        category_id = data.get("category_id")

        if not name or salary is None:
            return jsonify({"message": "name and salary are required"}), 400
        if not worker_code:
            return jsonify({"message": "worker_code (staff ID) is required"}), 400
        if not password or len(str(password)) < 6:
            return jsonify({"message": "password is required (min 6 characters)"}), 400
        if not category_id:
            return jsonify({"message": "category_id is required"}), 400
        if Worker.query.filter_by(worker_code=worker_code).first():
            return jsonify({"message": "Staff ID already in use"}), 409
        cat = WorkerCategory.query.get(category_id)
        if not cat:
            return jsonify({"message": "Invalid category"}), 400

        worker = Worker(
            worker_code=worker_code,
            name=name,
            role=data.get("role"),
            category_id=category_id,
            experience_years=data.get("experience_years", 0),
            phone=data.get("phone"),
            salary=salary,
            days_present=int(data.get("days_present", 0) or 0),
            days_absent=int(data.get("days_absent", 0) or 0),
        )
        worker.set_password(str(password))
        db.session.add(worker)
        db.session.commit()
        return jsonify(_serialize_worker(worker)), 201

    @app.route("/api/workers/<string:worker_code>", methods=["PUT"])
    def update_worker_public(worker_code: str):
        worker = Worker.query.filter_by(worker_code=worker_code).first()
        if not worker:
            return jsonify({"message": "Worker not found"}), 404

        data = request.get_json() or {}
        if "name" in data:
            worker.name = data["name"]
        if "role" in data:
            worker.role = data["role"]
        if "category_id" in data and data["category_id"] is not None:
            cat = WorkerCategory.query.get(data["category_id"])
            if not cat:
                return jsonify({"message": "Invalid category"}), 400
            worker.category_id = data["category_id"]
        if "experience_years" in data:
            worker.experience_years = data["experience_years"]
        if "phone" in data:
            worker.phone = data["phone"]
        if "salary" in data:
            worker.salary = data["salary"]
        if "days_present" in data:
            worker.days_present = int(data["days_present"] or 0)
        if "days_absent" in data:
            worker.days_absent = int(data["days_absent"] or 0)
        if "is_active" in data:
            worker.is_active = data["is_active"]
        new_password = data.get("password")
        if new_password:
            if len(str(new_password)) < 6:
                return jsonify({"message": "Password must be at least 6 characters"}), 400
            worker.set_password(str(new_password))

        db.session.commit()
        return jsonify(_serialize_worker(worker)), 200

    @app.route("/api/workers/<string:worker_code>", methods=["DELETE"])
    def delete_worker_public(worker_code: str):
        worker = Worker.query.filter_by(worker_code=worker_code).first()
        if not worker:
            return jsonify({"message": "Worker not found"}), 404

        db.session.delete(worker)
        db.session.commit()
        return jsonify({"message": "Worker deleted"}), 200

    # ---------- Suppliers ----------

    def _serialize_supplier(supplier: Supplier) -> dict:
        return {
            "id": supplier.id,
            "name": supplier.name,
            "contact_person": supplier.contact_person,
            "phone": supplier.phone,
            "email": supplier.email,
            "address": supplier.address,
        }

    @app.route("/api/suppliers", methods=["GET"])
    def list_suppliers_public():
        suppliers = Supplier.query.all()
        return jsonify([_serialize_supplier(s) for s in suppliers]), 200

    @app.route("/api/suppliers", methods=["POST"])
    def create_supplier_public():
        data = request.get_json() or {}
        name = data.get("name")
        if not name:
            return jsonify({"message": "name is required"}), 400

        supplier = Supplier(
            name=name,
            contact_person=data.get("contact_person"),
            phone=data.get("phone"),
            email=data.get("email"),
            address=data.get("address"),
        )
        db.session.add(supplier)
        db.session.commit()
        return jsonify(_serialize_supplier(supplier)), 201

    @app.route("/api/suppliers/<int:supplier_id>", methods=["PUT"])
    def update_supplier_public(supplier_id: int):
        supplier = Supplier.query.get(supplier_id)
        if not supplier:
            return jsonify({"message": "Supplier not found"}), 404

        data = request.get_json() or {}
        if "name" in data:
            supplier.name = data["name"]
        if "contact_person" in data:
            supplier.contact_person = data["contact_person"]
        if "phone" in data:
            supplier.phone = data["phone"]
        if "email" in data:
            supplier.email = data["email"]
        if "address" in data:
            supplier.address = data["address"]

        db.session.commit()
        return jsonify(_serialize_supplier(supplier)), 200

    @app.route("/api/suppliers/<int:supplier_id>", methods=["DELETE"])
    def delete_supplier_public(supplier_id: int):
        supplier = Supplier.query.get(supplier_id)
        if not supplier:
            return jsonify({"message": "Supplier not found"}), 404

        db.session.delete(supplier)
        db.session.commit()
        return jsonify({"message": "Supplier deleted"}), 200

    # ---------- Attendance ----------

    @app.route("/api/admin/attendance", methods=["POST"])
    @jwt_required()
    def mark_attendance():
        identity = get_jwt() or {}
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

    # ---------- HR Portal Endpoints ----------

    @app.route("/api/hr/attendance", methods=["POST"])
    @jwt_required()
    def hr_mark_attendance():
        identity = get_jwt() or {}
        role = identity.get("role")
        cat = identity.get("category_name")
        if role != "admin" and (not cat or cat.upper() != "HR"):
            return jsonify({"message": "HR or Admin access required"}), 403

        data = request.get_json() or {}
        worker_code = data.get("worker_code")
        status = data.get("status")
        att_date_str = data.get("date")

        if not worker_code or not status:
            return jsonify({"message": "worker_code and status are required"}), 400

        worker = Worker.query.filter_by(worker_code=worker_code).first()
        if not worker:
            return jsonify({"message": "Worker not found"}), 404

        if role != "admin" and worker.category and worker.category.name.upper() == "HR":
            return jsonify({"message": "HR cannot modify HR attendance"}), 403

        if att_date_str:
            att_date = datetime.strptime(att_date_str, "%Y-%m-%d").date()
        else:
            att_date = date.today()

        if status.lower() == "present":
            worker.days_present += 1
        elif status.lower() == "absent":
            worker.days_absent += 1

        record = WorkerAttendance(
            worker_id=worker.id,
            status=status,
            date=att_date,
        )
        db.session.add(record)
        db.session.commit()
        return jsonify({"id": record.id, "message": "Attendance marked"}), 200

    @app.route("/api/hr/workers/<string:worker_code>/salary-request", methods=["POST"])
    @jwt_required()
    def hr_request_salary_change(worker_code: str):
        identity = get_jwt() or {}
        role = identity.get("role")
        cat = identity.get("category_name")
        if role != "admin" and (not cat or cat.upper() != "HR"):
            return jsonify({"message": "HR or Admin access required"}), 403

        worker = Worker.query.filter_by(worker_code=worker_code).first()
        if not worker:
            return jsonify({"message": "Worker not found"}), 404

        if role != "admin" and worker.category and worker.category.name.upper() == "HR":
            return jsonify({"message": "HR cannot request salary changes for HR"}), 403

        data = request.get_json() or {}
        proposed_salary = data.get("salary")
        proposed_bonus = data.get("bonus")
        
        req = SalaryChangeRequest(
            worker_id=worker.id,
            requested_by_role="hr",
            proposed_salary=proposed_salary,
            proposed_bonus=proposed_bonus
        )
        db.session.add(req)
        db.session.commit()
        return jsonify({"message": "Salary change request submitted successfully", "id": req.id}), 201

    @app.route("/api/admin/salary-requests", methods=["GET"])
    @jwt_required()
    def get_salary_requests():
        identity = get_jwt() or {}
        if identity.get("role") != "admin":
            return jsonify({"message": "Admin access required"}), 403
        
        reqs = SalaryChangeRequest.query.order_by(SalaryChangeRequest.created_at.desc()).all()
        return jsonify([{
            "id": r.id,
            "worker_name": r.worker.name,
            "worker_code": r.worker.worker_code,
            "current_salary": float(r.worker.salary),
            "proposed_salary": float(r.proposed_salary) if r.proposed_salary is not None else None,
            "proposed_bonus": float(r.proposed_bonus) if r.proposed_bonus is not None else None,
            "status": r.status,
            "created_at": r.created_at.isoformat()
        } for r in reqs]), 200

    @app.route("/api/admin/salary-requests/<int:req_id>", methods=["PUT"])
    @jwt_required()
    def resolve_salary_request(req_id: int):
        identity = get_jwt() or {}
        if identity.get("role") != "admin":
            return jsonify({"message": "Admin access required"}), 403
        
        req = SalaryChangeRequest.query.get(req_id)
        if not req:
            return jsonify({"message": "Request not found"}), 404
            
        data = request.get_json() or {}
        status = data.get("status")
        if status not in ["Approved", "Rejected"]:
            return jsonify({"message": "Invalid status"}), 400
            
        req.status = status
        
        if status == "Approved":
            msg_content = "Your recent salary request has been approved.\n\n"
            if req.proposed_salary is not None:
                req.worker.salary = req.proposed_salary
                msg_content += f"New Base Salary: ${req.proposed_salary}\n"
            if req.proposed_bonus is not None:
                payment = SalaryPayment(
                    worker_id=req.worker.id,
                    month=date.today().month,
                    year=date.today().year,
                    amount=req.proposed_bonus
                )
                db.session.add(payment)
                msg_content += f"Bonus Awarded: ${req.proposed_bonus}\n"
                
            msg = Message(
                sender_role="admin",
                receiver_role="worker",
                receiver_worker_id=req.worker.id,
                content=msg_content.strip()
            )
            db.session.add(msg)
            
            # Notify HR of approval
            hr_msg = Message(
                sender_role="admin",
                receiver_role="hr",
                receiver_worker_id=None,
                content=f"Salary request for {req.worker.name} ({req.worker.worker_code}) has been approved."
            )
            db.session.add(hr_msg)
            
        elif status == "Rejected":
            # Notify HR of rejection
            hr_msg = Message(
                sender_role="admin",
                receiver_role="hr",
                receiver_worker_id=None,
                content=f"Salary request for {req.worker.name} ({req.worker.worker_code}) has been rejected."
            )
            db.session.add(hr_msg)
            
        db.session.commit()
        return jsonify({"message": f"Request {status.lower()}"}), 200

    # ---------- Salary Payments ----------

    @app.route("/api/admin/salaries", methods=["POST"])
    @jwt_required()
    def record_salary_payment():
        identity = get_jwt() or {}
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

    # ---------- Orders listing ----------

    @app.route("/api/orders", methods=["GET"])
    def list_orders():
        """
        Simple public listing of orders with items for admin dashboards.
        """
        orders = Order.query.order_by(Order.created_at.asc()).all()
        result = []
        for o in orders:
            result.append(
                {
                    "id": o.id,
                    "customer_name": o.customer_name,
                    "created_at": o.created_at.isoformat() if o.created_at else None,
                    "payment_method": o.payment_method,
                    "total_amount": float(o.total_amount),
                    "items": [
                        {
                            "product_id": item.product_id,
                            "product_name": item.product.name if item.product else None,
                            "quantity": item.quantity,
                            "unit_price": float(item.unit_price),
                            "line_total": float(item.line_total),
                        }
                        for item in o.items
                    ],
                }
            )
        return jsonify(result), 200

    # ---------- Reporting ----------

    def _daily_sales_payload(target_date: date):
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

        return {
            "date": target_date.isoformat(),
            "total_revenue": total_revenue,
            "orders_count": len(orders),
            "top_products": sorted(
                top_products.values(),
                key=lambda x: x["revenue"],
                reverse=True,
            ),
        }

    @app.route("/api/admin/reports/daily-sales", methods=["GET"])
    @jwt_required()
    def daily_sales():
        identity = get_jwt() or {}
        if identity.get("role") != "admin":
            return jsonify({"message": "Admin access required"}), 403

        date_str = request.args.get("date")
        if date_str:
            target_date = datetime.strptime(date_str, "%Y-%m-%d").date()
        else:
            target_date = date.today()
        return jsonify(_daily_sales_payload(target_date)), 200

    @app.route("/api/reports/daily-sales", methods=["GET"])
    def daily_sales_public():
        date_str = request.args.get("date")
        if date_str:
            target_date = datetime.strptime(date_str, "%Y-%m-%d").date()
        else:
            target_date = date.today()
        return jsonify(_daily_sales_payload(target_date)), 200

    def _monthly_summary_payload(year: int, month: int):
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

        return {
            "year": year,
            "month": month,
            "total_revenue": total_revenue,
            "total_salaries": total_salaries,
            "total_purchase_costs": total_purchase_costs,
            "net_profit": net_profit,
        }

    @app.route("/api/admin/reports/monthly-summary", methods=["GET"])
    @jwt_required()
    def monthly_summary():
        identity = get_jwt_identity() or {}
        if identity.get("role") != "admin":
            return jsonify({"message": "Admin access required"}), 403

        year = int(request.args.get("year", date.today().year))
        month = int(request.args.get("month", date.today().month))
        return jsonify(_monthly_summary_payload(year, month)), 200

    @app.route("/api/reports/monthly-summary", methods=["GET"])
    def monthly_summary_public():
        year = int(request.args.get("year", date.today().year))
        month = int(request.args.get("month", date.today().month))
        return jsonify(_monthly_summary_payload(year, month)), 200

    # ---------- Worker Portal Endpoints ----------

    @app.route("/api/worker/me", methods=["GET"])
    @jwt_required()
    def get_worker_profile():
        identity = get_jwt() or {}
        worker_id = identity.get("id")
        worker = Worker.query.get(worker_id)
        if not worker:
            return jsonify({"message": "Profile not found"}), 404

        return jsonify({
            "id": worker.worker_code,
            "name": worker.name,
            "role": worker.role,
            "category_name": worker.category.name if worker.category else None,
            "experience_years": worker.experience_years,
            "phone": worker.phone,
            "salary": float(worker.salary),
            "days_present": worker.days_present,
            "days_absent": worker.days_absent
        }), 200

    @app.route("/api/worker/leaves", methods=["GET"])
    @jwt_required()
    def get_my_leaves():
        identity = get_jwt() or {}
        worker_id = identity.get("id")
        leaves = LeaveRequest.query.filter_by(worker_id=worker_id).order_by(LeaveRequest.created_at.desc()).all()
        return jsonify([
            {
                "id": l.id,
                "date": l.date.isoformat(),
                "reason": l.reason,
                "status": l.status,
                "created_at": l.created_at.isoformat()
            } for l in leaves
        ]), 200

    @app.route("/api/worker/leaves", methods=["POST"])
    @jwt_required()
    def submit_leave_request():
        identity = get_jwt() or {}
        worker_id = identity.get("id")
        data = request.get_json() or {}
        
        att_date_str = data.get("date")
        reason = data.get("reason")
        
        if not att_date_str or not reason:
            return jsonify({"message": "date and reason are required"}), 400
            
        try:
            att_date = datetime.strptime(att_date_str, "%Y-%m-%d").date()
        except ValueError:
            return jsonify({"message": "Invalid date format, use YYYY-MM-DD"}), 400

        leave = LeaveRequest(worker_id=worker_id, date=att_date, reason=reason)
        db.session.add(leave)
        db.session.commit()
        return jsonify({"id": leave.id, "message": "Leave request submitted"}), 201

    @app.route("/api/hr/leaves", methods=["GET"])
    @jwt_required()
    def list_all_leaves():
        identity = get_jwt() or {}
        role = identity.get("role")
        cat = identity.get("category_name")
        if role != "admin" and (not cat or cat.upper() != "HR"):
            return jsonify({"message": "HR or Admin access required"}), 403

        leaves = LeaveRequest.query.order_by(LeaveRequest.created_at.desc()).all()
        return jsonify([
            {
                "id": l.id,
                "worker_name": l.worker.name if l.worker else "Unknown",
                "worker_code": l.worker.worker_code if l.worker else "Unknown",
                "date": l.date.isoformat(),
                "reason": l.reason,
                "status": l.status,
                "created_at": l.created_at.isoformat()
            } for l in leaves
        ]), 200

    @app.route("/api/hr/leaves/<int:leave_id>", methods=["PUT"])
    @jwt_required()
    def resolve_leave(leave_id: int):
        identity = get_jwt() or {}
        role = identity.get("role")
        cat = identity.get("category_name")
        if role != "admin" and (not cat or cat.upper() != "HR"):
            return jsonify({"message": "HR or Admin access required"}), 403

        leave = LeaveRequest.query.get(leave_id)
        if not leave:
            return jsonify({"message": "Leave request not found"}), 404

        data = request.get_json() or {}
        status = data.get("status")
        if status in ["Approved", "Rejected"]:
            leave.status = status
            if status == "Approved" and leave.worker:
                leave.worker.days_absent += 1
                att = WorkerAttendance(worker_id=leave.worker_id, status="Absent", date=leave.date)
                db.session.add(att)
            db.session.commit()
            return jsonify({"message": f"Leave {status.lower()} successfully"}), 200
        return jsonify({"message": "Invalid status"}), 400

    @app.route("/api/worker/messages", methods=["GET"])
    @jwt_required()
    def get_my_messages():
        identity = get_jwt() or {}
        worker_id = identity.get("id")
        
        # Include messages specifically for this worker OR broadcasted to all workers
        messages = Message.query.filter(
            db.or_(
                Message.receiver_worker_id == worker_id,
                db.and_(Message.receiver_role == "worker", Message.receiver_worker_id == None)
            )
        ).order_by(Message.created_at.desc()).all()
        return jsonify([
            {
                "id": m.id,
                "sender_role": m.sender_role,
                "sender_name": m.sender.name if m.sender else ("Admin" if m.sender_role == "admin" else "Unknown"),
                "content": m.content,
                "is_read": m.is_read,
                "created_at": m.created_at.isoformat()
            } for m in messages
        ]), 200

    @app.route("/api/worker/messages", methods=["POST"])
    @jwt_required()
    def send_message():
        identity = get_jwt() or {}
        worker_id = identity.get("id")
        role = identity.get("role")
        
        data = request.get_json() or {}
        receiver_role = data.get("receiver_role") # 'hr' or 'admin'
        content = data.get("content")
        
        if not receiver_role or not content:
            return jsonify({"message": "receiver_role and content are required"}), 400

        msg = Message(
            sender_worker_id=worker_id if role == "worker" else None,
            sender_role="hr" if identity.get("category_name") == "HR" else role,
            receiver_role=receiver_role,
            content=content
        )
        db.session.add(msg)
        db.session.commit()
        return jsonify({"id": msg.id, "message": "Message sent successfully"}), 201

    @app.route("/api/admin/messages", methods=["GET"])
    @jwt_required()
    def get_admin_messages():
        identity = get_jwt() or {}
        role = identity.get("role")
        cat = identity.get("category_name", "")
        
        # If Admin, fetch all messages sent to 'admin'
        # If HR, fetch all messages sent to 'hr'
        target_role = "hr" if cat == "HR" else "admin"
        if role != "admin" and target_role != "hr":
            return jsonify({"message": "Access denied"}), 403

        worker_id = identity.get("id") if target_role == "hr" else None
        
        if worker_id:
            messages = Message.query.filter(
                db.or_(
                    Message.receiver_role == target_role,
                    Message.receiver_worker_id == worker_id
                )
            ).order_by(Message.created_at.desc()).all()
        else:
            messages = Message.query.filter_by(receiver_role=target_role).order_by(Message.created_at.desc()).all()
            
        # Check the sender name without crashing
        return jsonify([
            {
                "id": m.id,
                "sender_name": (m.sender.name if m.sender else "Unknown Worker") if m.sender_role == "worker" else ("HR" if m.sender_role == "hr" else "Admin"),
                "sender_code": (m.sender.worker_code if m.sender else "Unknown") if m.sender_role == "worker" else ("" if m.sender_role == "admin" else "HR"),
                "sender_role": m.sender_role,
                "content": m.content,
                "is_read": m.is_read,
                "created_at": m.created_at.isoformat()
            } for m in messages
        ]), 200

    @app.route("/api/admin/messages", methods=["POST"])
    @jwt_required()
    def send_admin_message():
        identity = get_jwt() or {}
        role = identity.get("role")
        cat = identity.get("category_name", "")
        
        target_role = "hr" if cat and isinstance(cat, str) and cat.upper() == "HR" else "admin"
        if role != "admin" and target_role != "hr":
            return jsonify({"message": "Access denied"}), 403

        data = request.get_json() or {}
        receiver_role = data.get("receiver_role", "worker")
        
        receiver_worker_id = data.get("receiver_worker_id")
        if receiver_worker_id:
            try:
                receiver_worker_id = int(receiver_worker_id)
            except ValueError:
                return jsonify({"message": "Invalid worker ID"}), 400
        content = (data.get("content") or "").strip()
        if not content:
            return jsonify({"message": "Content is required"}), 400

        msg = Message(
            sender_worker_id=identity.get("id") if role == "worker" else None,
            sender_role=target_role,
            receiver_role=receiver_role,
            receiver_worker_id=receiver_worker_id,
            content=content
        )
        db.session.add(msg)
        db.session.commit()
        return jsonify({"message": "Message sent successfully", "id": msg.id}), 201

    @app.route("/api/admin/messages/<int:msg_id>/read", methods=["PUT"])
    @jwt_required()
    def mark_message_read(msg_id: int):
        msg = Message.query.get(msg_id)
        if msg:
            msg.is_read = True
            db.session.commit()
        return jsonify({"message": "Marked as read"}), 200

    return app


if __name__ == "__main__":
    app = create_app()
    app.run(host="0.0.0.0", port=5000, debug=True)

