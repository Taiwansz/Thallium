import click
from flask.cli import with_appcontext
from extensions import db
from models import Cliente, Conta, Cartao
from werkzeug.security import generate_password_hash
from datetime import date
from decimal import Decimal
import random

@click.command('seed_admin')
@with_appcontext
def seed_admin_command():
    """Create a Master Admin User if not exists."""

    # User requested specific credentials
    email_val = "admintopzao@gmail.com"
    username = "Admin Topzao"

    existing = Cliente.query.filter_by(email=email_val).first()
    if existing:
        print(f"Admin user {username} already exists.")
        # Update balance just in case
        conta = Conta.query.filter_by(id_cliente=existing.id_cliente).first()
        if conta:
            conta.saldo = Decimal("999999999.00")
            db.session.commit()
            print("Admin balance reset to 999M.")
        return

    print(f"Creating Admin user {username}...")

    senha_hash = generate_password_hash("admin")

    # Needs a valid CPF structure to pass potential future validations, even if seeding.
    # 000.000.000-00
    cpf_val = "000.000.000-00"

    admin = Cliente(
        nome="Admin Topzao",
        email=email_val,
        cpf=cpf_val,
        senha=senha_hash,
        senha_transacao=generate_password_hash("0000") # Default PIN
    )
    db.session.add(admin)
    db.session.flush()

    conta = Conta(
        id_cliente=admin.id_cliente,
        saldo=Decimal("999999999.00"),
        data_abertura=date.today(),
        tipo_conta='Master'
    )
    db.session.add(conta)

    # Cartao Master
    cartao = Cartao(
        numero="9999888877776666",
        validade="12/99",
        cvv="999",
        id_cliente=admin.id_cliente,
        limite_total=Decimal("1000000.00"),
        data_vencimento=date.today()
    )
    db.session.add(cartao)

    db.session.commit()
    print("Admin user created successfully.")
    print(f"Login: {email_val}")
    print("Password: admin")
