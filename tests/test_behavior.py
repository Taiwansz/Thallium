import unittest
import json
import os
import sqlite3
import sys

# Ensure we can import app from root
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app import create_app
from app.config import Config

class TestConfig(Config):
    TESTING = True
    DB_NAME = 'thalium_test.db'
    SECRET_KEY = 'test_secret'

class ThaliumTestCase(unittest.TestCase):
    def setUp(self):
        self.app = create_app(TestConfig)
        self.client = self.app.test_client()
        self.app_context = self.app.app_context()
        self.app_context.push()
        self.init_db()

    def tearDown(self):
        self.app_context.pop()
        if os.path.exists(TestConfig.DB_NAME):
            try:
                os.remove(TestConfig.DB_NAME)
            except PermissionError:
                pass

    def init_db(self):
        from app.database import get_db
        db = get_db()
        cursor = db.cursor()

        cursor.execute("PRAGMA foreign_keys = ON;")
        cursor.execute('''CREATE TABLE IF NOT EXISTS Clientes (id_cliente INTEGER PRIMARY KEY AUTOINCREMENT, nome TEXT NOT NULL, email TEXT, cpf TEXT NOT NULL UNIQUE, senha TEXT NOT NULL);''')
        cursor.execute('''CREATE TABLE IF NOT EXISTS Contas (numero_conta INTEGER PRIMARY KEY AUTOINCREMENT, id_cliente INTEGER, saldo REAL DEFAULT 0.00, data_abertura DATE NOT NULL, tipo_conta TEXT NOT NULL, FOREIGN KEY (id_cliente) REFERENCES Clientes(id_cliente) ON DELETE CASCADE);''')
        cursor.execute('''CREATE TABLE IF NOT EXISTS Transacoes (id_transacao INTEGER PRIMARY KEY AUTOINCREMENT, numero_conta INTEGER, tipo_transacao TEXT NOT NULL, valor REAL NOT NULL, data_transacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP, descricao TEXT, FOREIGN KEY (numero_conta) REFERENCES Contas(numero_conta) ON DELETE CASCADE);''')
        cursor.execute('''CREATE TABLE IF NOT EXISTS Emprestimos (id_emprestimo INTEGER PRIMARY KEY AUTOINCREMENT, numero_conta INTEGER, valor_emprestimo REAL NOT NULL, juros REAL NOT NULL, prazo INTEGER NOT NULL, data_emprestimo DATE NOT NULL, data_vencimento DATE NOT NULL, status TEXT DEFAULT 'pendente', FOREIGN KEY (numero_conta) REFERENCES Contas(numero_conta) ON DELETE CASCADE);''')
        cursor.execute('''CREATE TABLE IF NOT EXISTS Historico_Transacoes (id_historico INTEGER PRIMARY KEY AUTOINCREMENT, numero_conta INTEGER, tipo_transacao TEXT, valor REAL NOT NULL, data_transacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP, descricao TEXT, FOREIGN KEY (numero_conta) REFERENCES Contas(numero_conta) ON DELETE CASCADE);''')
        cursor.execute('''CREATE TABLE IF NOT EXISTS cartoes (id INTEGER PRIMARY KEY AUTOINCREMENT, numero TEXT NOT NULL UNIQUE, validade TEXT NOT NULL, cvv TEXT NOT NULL, id_cliente INTEGER NOT NULL, FOREIGN KEY (id_cliente) REFERENCES Clientes(id_cliente));''')

        db.commit()

    def register(self, nome, cpf, email, senha):
        return self.client.post('/cadastrar_cliente',
            data=json.dumps(dict(nome=nome, cpf=cpf, email=email, senha=senha)),
            content_type='application/json')

    def login(self, email, password):
        return self.client.post('/login', data=dict(email=email, password=password), follow_redirects=True)

    def logout(self):
        return self.client.get('/logout', follow_redirects=True)

    def test_full_flow(self):
        # 1. Register User 1
        rv = self.register('Alice', '11111111111', 'alice@test.com', '1234')
        self.assertEqual(rv.status_code, 200)
        data = json.loads(rv.data)
        self.assertEqual(data['message'], 'Cliente, conta e cartão cadastrados com sucesso!')

        # 2. Login User 1
        rv = self.login('alice@test.com', '1234')
        self.assertIn(b'Oi, Alice', rv.data)
        self.assertIn(b'R$ 0,00', rv.data) # Check initial balance

        # 3. Deposit
        rv = self.client.post('/deposito', data=dict(valor='100.50'), follow_redirects=True)
        self.assertIn(b'R$ 100,50', rv.data)

        # 4. Withdraw
        rv = self.client.post('/saque', data=dict(valor='50.00'), follow_redirects=True)
        self.assertIn(b'R$ 50,50', rv.data)

        # 5. Register User 2
        self.logout()
        rv = self.register('Bob', '22222222222', 'bob@test.com', '1234')
        self.assertEqual(rv.status_code, 200)

        # 6. Login User 1 and Transfer to User 2
        self.login('alice@test.com', '1234')
        rv = self.client.post('/transfer', data=dict(recipient='bob@test.com', amount='20.00', description='Test Transfer'), follow_redirects=True)
        self.assertIn(b'R$ 30,50', rv.data) # 50.50 - 20.00 = 30.50

        # 7. Check User 2 Balance
        self.logout()
        rv = self.login('bob@test.com', '1234')
        self.assertIn(b'Oi, Bob', rv.data)
        self.assertIn(b'R$ 20,00', rv.data)

        # 8. Check History (User 2) - User 2 receives money but no transaction record is created in original code
        rv = self.client.get('/historico')
        # Bob shouldn't see the transfer in history based on current logic

        # Check Alice's History instead
        self.logout()
        self.login('alice@test.com', '1234')
        rv = self.client.get('/historico')
        self.assertIn(b'Test Transfer', rv.data)

        # Switch back to Bob for Boleto
        self.logout()
        self.login('bob@test.com', '1234')

        # 9. Pay Boleto
        rv = self.client.post('/pagamento_boleto', data=dict(valor='10.00'), follow_redirects=True)
        self.assertIn(b'R$ 10,00', rv.data)

        # 10. Loan
        rv = self.client.post('/emprestimo', data=dict(valor_emprestimo='1000', prazo='12'), follow_redirects=True)
        self.assertIn(b'enviado com sucesso', rv.data)

if __name__ == '__main__':
    unittest.main()
