import unittest
from app import app, db
from models import Cliente, Conta
from werkzeug.security import generate_password_hash
from decimal import Decimal
from datetime import date

class ModelTestCase(unittest.TestCase):
    def setUp(self):
        app.config.update({
            "TESTING": True,
            "SQLALCHEMY_DATABASE_URI": "sqlite:///:memory:",
            "WTF_CSRF_ENABLED": False
        })
        self.app = app.test_client()
        with app.app_context():
            db.drop_all() # Ensure we start clean even if it connects to file (though it shouldn't)
            db.create_all()

    def tearDown(self):
        with app.app_context():
            db.session.remove()
            db.drop_all()

    def test_create_client_and_account(self):
        with app.app_context():
            cliente = Cliente(nome='Test User', email='test@test.com', cpf='12345678901', senha='password')
            db.session.add(cliente)
            db.session.commit()

            conta = Conta(id_cliente=cliente.id_cliente, saldo=Decimal('100.00'), data_abertura=date(2024, 1, 1), tipo_conta='Corrente')
            db.session.add(conta)
            db.session.commit()

            self.assertEqual(Conta.query.count(), 1)
            self.assertEqual(Conta.query.first().saldo, 100.00)

    def test_negative_balance_check(self):
        # Python-side check logic usually resides in services, but we can test DB behavior here
        pass

if __name__ == '__main__':
    unittest.main()
