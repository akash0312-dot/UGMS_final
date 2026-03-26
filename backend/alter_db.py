from app import create_app
from models import db
from sqlalchemy import text
import traceback

app = create_app()
with app.app_context():
    try:
        db.session.execute(text("ALTER TABLE workers ADD COLUMN category_id INTEGER NULL;"))
        db.session.execute(text("ALTER TABLE workers ADD CONSTRAINT fk_worker_category FOREIGN KEY (category_id) REFERENCES worker_categories(id);"))
        db.session.commit()
        print("Column category_id added successfully.")
    except Exception as e:
        print("Error altering table:")
        traceback.print_exc()
