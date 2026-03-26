import sqlalchemy as sa
engine = sa.create_engine("mysql+pymysql://root:Akash03dec05%40@localhost:3306/grocery_store")
with engine.connect() as conn:
    conn.execute(sa.text("UPDATE alembic_version SET version_num='2c8f1b9a4d2e'"))
    try:
        conn.commit()
    except Exception:
        pass
print("Database version fixed.")
