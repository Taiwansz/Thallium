from extensions import db
from datetime import datetime, date
from sqlalchemy import ForeignKey
from sqlalchemy.orm import relationship
from flask_login import UserMixin

class Cliente(db.Model, UserMixin):
    __tablename__ = 'Clientes'
    id_cliente = db.Column(db.Integer, primary_key=True)

    def get_id(self):
        return str(self.id_cliente)
    nome = db.Column(db.String(100), nullable=False)
    email = db.Column(db.String(100), unique=True)
    cpf = db.Column(db.String(11), unique=True, nullable=False)
    senha = db.Column(db.String(255), nullable=False)
    senha_transacao = db.Column(db.String(255), nullable=True) # 4-digit PIN

    contas = relationship('Conta', backref='cliente', lazy=True)
    cartoes = relationship('Cartao', backref='cliente', lazy=True)
    chaves_pix = relationship('ChavePix', backref='cliente', lazy=True)

class Conta(db.Model):
    __tablename__ = 'Contas'
    numero_conta = db.Column(db.Integer, primary_key=True)
    id_cliente = db.Column(db.Integer, ForeignKey('Clientes.id_cliente', ondelete='CASCADE'))
    saldo = db.Column(db.Numeric(15, 2), default=0.00)
    data_abertura = db.Column(db.Date, nullable=False)
    tipo_conta = db.Column(db.String(20), nullable=False) # Simplified ENUM to String

    transacoes = relationship('Transacao', backref='conta', lazy=True)
    emprestimos = relationship('Emprestimo', backref='conta', lazy=True)

class Transacao(db.Model):
    __tablename__ = 'Transacoes'
    id_transacao = db.Column(db.Integer, primary_key=True)
    numero_conta = db.Column(db.Integer, ForeignKey('Contas.numero_conta', ondelete='CASCADE'))
    tipo_transacao = db.Column(db.String(50), nullable=False)
    valor = db.Column(db.Numeric(15, 2), nullable=False)
    data_transacao = db.Column(db.DateTime, default=datetime.utcnow)
    descricao = db.Column(db.String(255))
    categoria = db.Column(db.String(50), default='Outros')

class Emprestimo(db.Model):
    __tablename__ = 'Emprestimos'
    id_emprestimo = db.Column(db.Integer, primary_key=True)
    numero_conta = db.Column(db.Integer, ForeignKey('Contas.numero_conta', ondelete='CASCADE'))
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
    id_cliente = db.Column(db.Integer, ForeignKey('Clientes.id_cliente'))
    bloqueado = db.Column(db.Boolean, default=False)

    # Credit Details
    limite_total = db.Column(db.Numeric(15, 2), default=15000.00)
    limite_usado = db.Column(db.Numeric(15, 2), default=0.00)
    fatura_fechada = db.Column(db.Boolean, default=False)
    data_vencimento = db.Column(db.Date, nullable=False, default=date.today) # Simplified, usually day of month

    @property
    def limite_disponivel(self):
        return self.limite_total - self.limite_usado

class ChavePix(db.Model):
    __tablename__ = 'chaves_pix'
    id = db.Column(db.Integer, primary_key=True)
    tipo = db.Column(db.String(20), nullable=False) # cpf, email, aleatoria
    chave = db.Column(db.String(100), unique=True, nullable=False)
    id_cliente = db.Column(db.Integer, ForeignKey('Clientes.id_cliente', ondelete='CASCADE'))

class Investimento(db.Model):
    __tablename__ = 'investimentos'
    id = db.Column(db.Integer, primary_key=True)
    id_cliente = db.Column(db.Integer, ForeignKey('Clientes.id_cliente'))
    tipo = db.Column(db.String(50), nullable=False) # CDB, LCI, Tesouro
    valor_inicial = db.Column(db.Numeric(15, 2), nullable=False)
    data_aplicacao = db.Column(db.DateTime, default=datetime.utcnow)
    taxa_anual = db.Column(db.Numeric(5, 2), default=12.0) # 12% a.a. simulated
    resgatado = db.Column(db.Boolean, default=False)

class AuditLog(db.Model):
    __tablename__ = 'audit_logs'
    id = db.Column(db.Integer, primary_key=True)
    id_cliente = db.Column(db.Integer, ForeignKey('Clientes.id_cliente'))
    action = db.Column(db.String(100), nullable=False)
    details = db.Column(db.Text, nullable=True)
    ip_address = db.Column(db.String(50))
    timestamp = db.Column(db.DateTime, default=datetime.utcnow)
