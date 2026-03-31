import os
os.environ["DATABASE_URL"] = "mysql+pymysql://root:mWYSkGwxndJKUIQJXzGiVyxktVQrGtuf@gondola.proxy.rlwy.net:40244/railway"

from app import create_app, db
from sqlalchemy import create_engine, text, MetaData

app = create_app()

with app.app_context():
    print("Creating all tables in Railway...")
    db.create_all()
    print("Tables created successfully in Railway!")

    print("Now copying data...")
    local_uri = "mysql+pymysql://root:Akash03dec05%40@localhost:3306/grocery_store"
    local_engine = create_engine(local_uri)

    local_meta = MetaData()
    local_meta.reflect(bind=local_engine)

    table_order = [
        "worker_categories",
        "workers",
        "users",
        "suppliers",
        "products",
        "orders",
        "order_items",
        "leave_requests",
        "messages",
        "salary_change_requests",
        "salary_payments",
        "worker_attendance"
    ]

    with local_engine.connect() as local_conn:
        with db.engine.connect() as remote_conn:
            remote_conn.execute(text("SET FOREIGN_KEY_CHECKS=0;"))
            for table_name in table_order:
                if table_name in local_meta.tables:
                    print(f"Copying {table_name}...")
                    local_table = local_meta.tables[table_name]
                    
                    remote_meta = MetaData()
                    remote_meta.reflect(bind=db.engine, only=[table_name])
                    if table_name in remote_meta.tables:
                        remote_table = remote_meta.tables[table_name]
                        rows = local_conn.execute(local_table.select()).mappings().all()
                        if rows:
                            remote_conn.execute(remote_table.delete())
                            remote_conn.execute(remote_table.insert(), [dict(r) for r in rows])
            remote_conn.execute(text("SET FOREIGN_KEY_CHECKS=1;"))
            remote_conn.commit()

    print("MIGRATION TRULY COMPLETE!")
