import pytest
from app import app as flask_app
from extensions import db
from models import Cliente

@pytest.fixture
def app():
    flask_app.config.update({
        "TESTING": True,
        "SQLALCHEMY_DATABASE_URI": "sqlite:///:memory:",
        "WTF_CSRF_ENABLED": False
    })

    with flask_app.app_context():
        db.create_all()
        yield flask_app
        db.session.remove()
        db.drop_all()

@pytest.fixture
def client(app):
    return app.test_client()

@pytest.fixture
def runner(app):
    return app.test_cli_runner()

@pytest.fixture
def auth(client):
    class AuthActions:
        def login(self, email='test@example.com', password='password'):
            return client.post('/login', data={'email': email, 'password': password}, follow_redirects=True)

        def logout(self):
            return client.get('/logout', follow_redirects=True)

        def register(self, nome='Tester', cpf='12345678901', email='test@example.com', password='password123', confirm_password='password123'):
            return client.post('/cadastro', data={
                'nome': nome,
                'cpf': cpf,
                'email': email,
                'password': password,
                'confirm_password': confirm_password
            }, follow_redirects=True)

    return AuthActions()
