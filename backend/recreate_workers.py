import sys
import traceback
from app import create_app
from models import db
from sqlalchemy import text

app = create_app()
with app.app_context():
    try:
        # Disable foreign key checks momentarily to drop
        db.session.execute(text("SET FOREIGN_KEY_CHECKS = 0;"))
        db.session.execute(text("DROP TABLE IF EXISTS worker_attendance;"))
        db.session.execute(text("DROP TABLE IF EXISTS salary_payments;"))
        db.session.execute(text("DROP TABLE IF EXISTS workers;"))
        db.session.commit()
        db.session.execute(text("SET FOREIGN_KEY_CHECKS = 1;"))
        print("Dropped old tables.")
        
        db.create_all()
        print("Recreated schema.")
    except Exception as e:
        with open("recreate_err.txt", "w", encoding="utf-8") as f:
            traceback.print_exc(file=f)
        print("Error during table recreation saved to recreate_err.txt.")
