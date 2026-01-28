from extensions import db
from flask_login import UserMixin
from datetime import datetime

class Cliente(UserMixin, db.Model):
    __tablename__ = 'clientes'
    id_cliente = db.Column(db.Integer, primary_key=True)
    nome = db.Column(db.String(100), nullable=False)
    email = db.Column(db.String(100), unique=True, nullable=False)
    cpf = db.Column(db.String(11), unique=True, nullable=False)
    senha = db.Column(db.String(255), nullable=False)

    contas = db.relationship('Conta', backref='cliente', lazy=True)
    cartoes = db.relationship('Cartao', backref='cliente', lazy=True)

    def get_id(self):
        return str(self.id_cliente)

class Conta(db.Model):
    __tablename__ = 'contas'
    numero_conta = db.Column(db.Integer, primary_key=True)
    id_cliente = db.Column(db.Integer, db.ForeignKey('clientes.id_cliente'), nullable=False)
    saldo = db.Column(db.Numeric(15, 2), default=0.00)
    data_abertura = db.Column(db.Date, nullable=False)
    tipo_conta = db.Column(db.String(20), nullable=False)

    transacoes = db.relationship('Transacao', backref='conta', lazy=True)
    emprestimos = db.relationship('Emprestimo', backref='conta', lazy=True)

class Transacao(db.Model):
    __tablename__ = 'transacoes'
    id_transacao = db.Column(db.Integer, primary_key=True)
    numero_conta = db.Column(db.Integer, db.ForeignKey('contas.numero_conta'), nullable=False)
    tipo_transacao = db.Column(db.String(50), nullable=False)
    valor = db.Column(db.Numeric(15, 2), nullable=False)
    data_transacao = db.Column(db.DateTime, default=datetime.now)
    descricao = db.Column(db.String(255))

class Emprestimo(db.Model):
    __tablename__ = 'emprestimos'
    id_emprestimo = db.Column(db.Integer, primary_key=True)
    numero_conta = db.Column(db.Integer, db.ForeignKey('contas.numero_conta'), nullable=False)
    valor_emprestimo = db.Column(db.Numeric(15, 2), nullable=False)
    juros = db.Column(db.Numeric(5, 2), nullable=False)
    prazo = db.Column(db.Integer, nullable=False)
    data_emprestimo = db.Column(db.Date, nullable=False)
    data_vencimento = db.Column(db.Date, nullable=False)
    status = db.Column(db.String(20), default='pendente')

class Cartao(db.Model):
    __tablename__ = 'cartoes'
    id = db.Column(db.Integer, primary_key=True)
    numero = db.Column(db.String(16), unique=True, nullable=False)
    validade = db.Column(db.String(5), nullable=False)
    cvv = db.Column(db.String(3), nullable=False)
    id_cliente = db.Column(db.Integer, db.ForeignKey('clientes.id_cliente'), nullable=False)
