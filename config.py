import os
from dotenv import load_dotenv

load_dotenv()

class Config:
    SECRET_KEY = os.getenv('SECRET_KEY', 'default_dev_key_change_me')

    # Fix Render's Postgres URL (postgres:// -> postgresql://)
    database_url = os.getenv('DATABASE_URL')
    if database_url and database_url.startswith("postgres://"):
        database_url = database_url.replace("postgres://", "postgresql://", 1)

    if database_url:
        SQLALCHEMY_DATABASE_URI = database_url
    else:
        # Fallback to SQLite in instance folder
        basedir = os.path.abspath(os.path.dirname(__file__))
        SQLALCHEMY_DATABASE_URI = 'sqlite:///' + os.path.join(basedir, 'instance', 'thalium.db')

    # Log connection info (safely)
    db_type = 'PostgreSQL' if 'postgresql' in SQLALCHEMY_DATABASE_URI else 'SQLite'
    print(f"--> Using Database: {db_type}")
    SQLALCHEMY_TRACK_MODIFICATIONS = False

    # Email Config
    MAIL_SERVER = os.getenv('MAIL_SERVER', 'smtp.gmail.com')
    MAIL_PORT = int(os.getenv('MAIL_PORT', 587))
    MAIL_USE_TLS = os.getenv('MAIL_USE_TLS', 'true').lower() in ['true', 'on', '1']
    MAIL_USERNAME = os.getenv('MAIL_USERNAME')
    MAIL_PASSWORD = os.getenv('MAIL_PASSWORD')
    MAIL_DEFAULT_SENDER = os.getenv('MAIL_DEFAULT_SENDER', 'noreply@thalium.com')
    # Debug: Print email to console if no password set (dev mode)
    if not MAIL_PASSWORD:
        MAIL_BACKEND = 'console'

    # Log the database type (masking credentials)
    print(f"DEBUG: Using Database URI: {SQLALCHEMY_DATABASE_URI.split('@')[-1] if '@' in SQLALCHEMY_DATABASE_URI else SQLALCHEMY_DATABASE_URI}")
