import os

class Config:
    SECRET_KEY = os.environ.get('SECRET_KEY') or 'sua_chave_secreta'
    DB_NAME = os.environ.get('DB_NAME') or 'thalium.db'
