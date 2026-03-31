import os
from sqlalchemy import create_engine, MetaData
from sqlalchemy.orm import sessionmaker
from sqlalchemy.sql import text

local_uri = "mysql+pymysql://root:Akash03dec05%40@localhost:3306/grocery_store"
remote_uri = "mysql+pymysql://root:mWYSkGwxndJKUIQJXzGiVyxktVQrGtuf@gondola.proxy.rlwy.net:40244/railway"

local_engine = create_engine(local_uri)
remote_engine = create_engine(remote_uri)

local_meta = MetaData()
local_meta.reflect(bind=local_engine)

remote_meta = MetaData()
remote_meta.reflect(bind=remote_engine, views=False)

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
    with remote_engine.connect() as remote_conn:
        remote_conn.execute(text("SET FOREIGN_KEY_CHECKS=0;"))
        for table_name in table_order:
            if table_name in local_meta.tables and table_name in remote_meta.tables:
                print(f"Copying {table_name}...")
                local_table = local_meta.tables[table_name]
                remote_table = remote_meta.tables[table_name]
                rows = local_conn.execute(local_table.select()).mappings().all()
                if rows:
                    remote_conn.execute(remote_table.delete())
                    remote_conn.execute(remote_table.insert(), [dict(r) for r in rows])
        remote_conn.execute(text("SET FOREIGN_KEY_CHECKS=1;"))
        remote_conn.commit()

print("MIGRATION COMPLETE!")
