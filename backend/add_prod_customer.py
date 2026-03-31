import os

# Connect directly to the production database via Railway URL extracted from force_cloud.py
os.environ["DATABASE_URL"] = "mysql+pymysql://root:mWYSkGwxndJKUIQJXzGiVyxktVQrGtuf@gondola.proxy.rlwy.net:40244/railway"

from app import create_app, db
from models import Customer

app = create_app()

with app.app_context():
    print("Connecting to Production Database and creating tables...")
    db.create_all()
    print("New tables (like customers) successfully appended to production schema without data loss!")
