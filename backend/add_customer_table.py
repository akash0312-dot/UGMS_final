from app import create_app, db
from models import Customer

app = create_app()

with app.app_context():
    db.create_all()
    print("Customer table successfully created!")
