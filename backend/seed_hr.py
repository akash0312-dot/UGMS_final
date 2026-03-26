from app import create_app, db
from models import Worker, WorkerCategory

app = create_app()

with app.app_context():
    hr_cat = WorkerCategory.query.filter_by(name='HR').first()
    if not hr_cat:
        print("HR category not found, creating it")
        hr_cat = WorkerCategory(name='HR')
        db.session.add(hr_cat)
        db.session.commit()
    
    hr_worker = Worker.query.filter_by(worker_code="HR001").first()
    if not hr_worker:
        print("Creating HR worker 'HR001'")
        hr_worker = Worker(
            worker_code="HR001",
            name="Alice HR",
            category_id=hr_cat.id,
            role="HR Manager",
            experience_years=5,
            phone="555-0100",
            salary=5000.00
        )
        hr_worker.set_password("hr001pass")
        db.session.add(hr_worker)
        db.session.commit()
        print("HR worker successfully created. ID: HR001, Pass: hr001pass")
    else:
        print("HR worker HR001 already exists")
