from werkzeug.security import generate_password_hash, check_password_hash
from app.models.client import ClientModel
from app.models.account import AccountModel
from app.models.card import CardModel
from datetime import date
import random
import sqlite3

class AuthService:
    @staticmethod
    def register_user(nome, cpf, email, senha):
        if not nome or not cpf or not email or not senha:
            raise ValueError('Nome, CPF, email e senha são obrigatórios!')

        senha_hash = generate_password_hash(senha)

        try:
            id_cliente = ClientModel.create(nome, cpf, email, senha_hash)

            # Create Account
            saldo_inicial = 0.00
            tipo_conta = 'Corrente'
            data_abertura = date.today()
            AccountModel.create(id_cliente, saldo_inicial, data_abertura, tipo_conta)

            # Create Card
            def gerar_numero_cartao():
                return ''.join([str(random.randint(0, 9)) for _ in range(16)])
            numero_cartao = gerar_numero_cartao()
            validade = f"{random.randint(1, 12):02d}/{random.randint(25, 30)}"
            cvv = f"{random.randint(100, 999)}"
            CardModel.create(numero_cartao, validade, cvv, id_cliente)

            return {
                'id_cliente': id_cliente,
                'tipo_conta': tipo_conta,
                'data_abertura': str(data_abertura),
                'numero_cartao': numero_cartao,
                'validade': validade,
                'cvv': cvv
            }

        except sqlite3.IntegrityError:
            raise ValueError('CPF ou email já existe.')
        except Exception as e:
            raise Exception(f'Erro inesperado: {str(e)}')

    @staticmethod
    def authenticate(email, password):
        user = ClientModel.get_by_email(email)
        if not user:
            raise ValueError('Usuário não encontrado.')
        if not check_password_hash(user['senha'], password):
            raise ValueError('Senha incorreta.')
        return user
