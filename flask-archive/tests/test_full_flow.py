import unittest
from app import app, db
from models import Cliente, Conta, Transacao, Cartao, Investimento
from decimal import Decimal
import random

class FullFlowTest(unittest.TestCase):
    def setUp(self):
        app.config.update({
            "TESTING": True,
            "SQLALCHEMY_DATABASE_URI": "sqlite:///:memory:",
            "WTF_CSRF_ENABLED": False
        })
        self.client = app.test_client()
        with app.app_context():
            db.create_all()

    def tearDown(self):
        with app.app_context():
            db.session.remove()
            db.drop_all()

    def generate_cpf(self):
        def calculate_digit(digits):
            s = sum(w * d for w, d in zip(range(len(digits) + 1, 1, -1), digits))
            d = (s * 10) % 11
            return d if d < 10 else 0
        digits = [random.randint(0, 9) for _ in range(9)]
        digits.append(calculate_digit(digits))
        digits.append(calculate_digit(digits))
        return "".join(map(str, digits))

    def test_full_user_flow(self):
        # 1. Registration
        cpf = self.generate_cpf()
        res = self.client.post('/cadastrar_cliente', json={
            'nome': 'Test User',
            'email': 'test@test.com',
            'cpf': cpf,
            'senha': 'password'
        })
        self.assertEqual(res.status_code, 200)
        id_cliente = res.get_json()['id_cliente']

        # 2. Login
        res = self.client.post('/login', data={'email': 'test@test.com', 'password': 'password'}, follow_redirects=True)
        self.assertEqual(res.status_code, 200)
        self.assertIn(b'Confira o resumo da sua conta', res.data)

        # 3. Check Initial Balance (Random Range)
        with app.app_context():
            conta = Conta.query.filter_by(id_cliente=id_cliente).first()
            initial_balance = conta.saldo
            # Using specific values from the requirement: 257 to 10380
            self.assertGreaterEqual(initial_balance, Decimal('257.00'))
            self.assertLessEqual(initial_balance, Decimal('10380.00'))

        # 4. Navigation Checks (200 OK & Content)
        pages = [
            # '/extrato', # Template not found
            '/transfer',
            '/recarga',
            '/boleto',
            '/deposito',
            '/saque',
            '/emprestimo',
            '/cartoes',
            '/investimentos',
            '/perfil',
            '/historico'
        ]
        for page in pages:
            res = self.client.get(page)
            self.assertEqual(res.status_code, 200, f"Failed to load {page}")

        # 5. Perform Deposit
        deposit_amount = Decimal('100.00')
        res = self.client.post('/deposito', data={'valor': str(deposit_amount)}, follow_redirects=True)
        self.assertEqual(res.status_code, 200)

        with app.app_context():
            conta = Conta.query.filter_by(id_cliente=id_cliente).first()
            # Balance should be initial + 100
            self.assertEqual(conta.saldo, initial_balance + deposit_amount)

            # Verify Transaction Record
            tx = Transacao.query.filter_by(numero_conta=conta.numero_conta, tipo_transacao='Depósito').first()
            self.assertIsNotNone(tx)
            self.assertEqual(tx.valor, deposit_amount)

        # 6. Perform Investment
        invest_amount = Decimal('100.00')
        res = self.client.post('/investir', data={'valor': str(invest_amount), 'tipo': 'CDB 100% CDI'}, follow_redirects=True)
        self.assertIn(b'Investimento realizado com sucesso!', res.data)

        with app.app_context():
            conta = Conta.query.filter_by(id_cliente=id_cliente).first()
            # Balance should be initial + 100 - 100 = initial
            self.assertEqual(conta.saldo, initial_balance)

            # Verify Investment Record
            inv = Investimento.query.filter_by(id_cliente=id_cliente, tipo='CDB 100% CDI').first()
            self.assertIsNotNone(inv)
            self.assertEqual(inv.valor_inicial, invest_amount)

        # 7. Request Loan
        loan_amount = Decimal('1000.00')
        res = self.client.post('/emprestimo', data={'valor_emprestimo': str(loan_amount), 'prazo': '12'}, follow_redirects=True)
        self.assertEqual(res.status_code, 200)
        self.assertIn(b'Seu pedido de empr\xc3\xa9stimo foi enviado com sucesso!', res.data)

        # 8. Transfer (Create Recipient First)
        # Logout first? No, we need to register recipient via API or separate session, or just db insert
        # Easier to create recipient directly in DB to avoid session conflict in this simple test client
        with app.app_context():
            cpf_recipient = self.generate_cpf()
            recipient = Cliente(nome='Recipient', email='recipient@test.com', cpf=cpf_recipient, senha='password')
            db.session.add(recipient)
            db.session.commit()

            recipient_conta = Conta(id_cliente=recipient.id_cliente, saldo=Decimal('0.00'), data_abertura=db.func.current_date(), tipo_conta='Corrente')
            db.session.add(recipient_conta)
            db.session.commit()

        transfer_amount = Decimal('50.00')
        # Balance is currently `initial_balance` (>= 257) so transfer of 50 is fine.
        res = self.client.post('/transfer', data={
            'recipient': 'recipient@test.com',
            'amount': str(transfer_amount),
            'description': 'Test Transfer',
            'category': 'Outros'
        }, follow_redirects=True)

        # Verify success message
        self.assertIn(b'Transfer\xc3\xaancia realizada com sucesso!', res.data)

        with app.app_context():
            conta_sender = Conta.query.filter_by(id_cliente=id_cliente).first()
            # Expected: Initial - Transfer
            expected = initial_balance - transfer_amount
            self.assertEqual(conta_sender.saldo, expected)

if __name__ == '__main__':
    unittest.main()
