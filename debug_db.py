from app import app, db
from sqlalchemy import inspect

with app.app_context():
    print(f"DB URI: {app.config['SQLALCHEMY_DATABASE_URI']}")
    inspector = inspect(db.engine)
    print("Tables found:", inspector.get_table_names())
