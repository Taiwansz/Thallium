from flask import Flask
from config import Config
from extensions import db
from models import *
import os

def create_app():
    app = Flask(__name__)
    app.config.from_object(Config)
    db.init_app(app)
    return app

if __name__ == '__main__':
    app = create_app()
    with app.app_context():
        if os.path.exists('thalium.db'):
            os.remove('thalium.db')
            print("Removed existing database.")
        db.create_all()
        print("Database initialized successfully!")
