import sys
import traceback
from app import create_app
from models import ensure_default_worker_categories

try:
    app = create_app()
    with app.app_context():
        ensure_default_worker_categories()
        print("Success!")
except Exception as e:
    with open("db_error2.txt", "w") as f:
        traceback.print_exc(file=f)
    print("Error saved to db_error2.txt")
