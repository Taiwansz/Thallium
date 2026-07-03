from flask import Blueprint, render_template, request, redirect, url_for, flash, jsonify
from werkzeug.security import generate_password_hash, check_password_hash
from datetime import date
import random
from extensions import db, limiter
from models import Cliente, Conta, Cartao
from flask_login import login_user, login_required, logout_user, current_user
from sqlalchemy.exc import IntegrityError
from utils import validate_cpf

auth_bp = Blueprint('auth', __name__)

@auth_bp.route('/cadastro')
def cadastro():
    return render_template('register.html')

@auth_bp.route('/cadastrar_cliente', methods=['POST'])
def cadastrar_cliente():
    data = request.json
    nome = data.get('nome')
    cpf = data.get('cpf')
    email = data.get('email')
    senha = data.get('senha')

    if not nome or not cpf or not email or not senha:
        return jsonify({'message': 'Nome, CPF, email e senha são obrigatórios!'}), 400

    if not validate_cpf(cpf):
         return jsonify({'message': 'CPF inválido.'}), 400

    senha_hash = generate_password_hash(senha)

    try:
        new_cliente = Cliente(nome=nome, cpf=cpf, email=email, senha=senha_hash)
        db.session.add(new_cliente)
        db.session.flush()

        # Create Account
        new_conta = Conta(
            id_cliente=new_cliente.id_cliente,
            saldo=round(random.uniform(257, 10380), 2),
            data_abertura=date.today(),
            tipo_conta='Corrente'
        )
        db.session.add(new_conta)

        # Create Card
        def gerar_numero_cartao():
            return ''.join([str(random.randint(0, 9)) for _ in range(16)])

        numero_cartao = gerar_numero_cartao()
        while Cartao.query.filter_by(numero=numero_cartao).first():
             numero_cartao = gerar_numero_cartao()

        validade = f"{random.randint(1, 12):02d}/{random.randint(25, 30)}"
        cvv = f"{random.randint(100, 999)}"

        new_cartao = Cartao(
            numero=numero_cartao,
            validade=validade,
            cvv=cvv,
            id_cliente=new_cliente.id_cliente
        )
        db.session.add(new_cartao)

        db.session.commit()

        return jsonify({
            'message': 'Cliente, conta e cartão cadastrados com sucesso!',
            'id_cliente': new_cliente.id_cliente,
            'tipo_conta': new_conta.tipo_conta,
            'data_abertura': str(new_conta.data_abertura),
            'numero_cartao': numero_cartao,
            'validade': validade,
            'cvv': cvv
        })

    except IntegrityError:
        db.session.rollback()
        return jsonify({'message': 'Erro ao cadastrar: CPF ou email já existe.'}), 400
    except Exception as e:
        db.session.rollback()
        return jsonify({'message': f'Erro inesperado: {str(e)}'}), 500

@auth_bp.route('/login', methods=['GET', 'POST'])
@limiter.limit("10 per minute")
def login():
    if current_user.is_authenticated:
        return redirect(url_for('index'))

    if request.method == 'POST':
        email = request.form['email']
        password = request.form['password']

        user = Cliente.query.filter_by(email=email).first()

        if user and check_password_hash(user.senha, password):
            login_user(user)
            return redirect(url_for('index'))
        else:
            flash('Usuário ou senha inválidos.', 'error')

    return render_template('login.html')

@auth_bp.route('/logout')
@login_required
def logout():
    logout_user()
    return redirect(url_for('auth.login'))

@auth_bp.route('/config_senha_transacao', methods=['GET', 'POST'])
@login_required
def config_senha_transacao():
    if request.method == 'POST':
        pin = request.form.get('pin')
        confirm_pin = request.form.get('confirm_pin')

        if not pin or not pin.isdigit() or len(pin) != 4:
             flash('A senha deve conter exatamente 4 dígitos numéricos.', 'error')
        elif pin != confirm_pin:
             flash('As senhas não conferem.', 'error')
        else:
            current_user.senha_transacao = generate_password_hash(pin)
            db.session.commit()
            flash('Senha de transação configurada com sucesso!', 'success')
            return redirect(url_for('auth.perfil'))

    return render_template('config_senha_transacao.html')

@auth_bp.route('/perfil', methods=['GET', 'POST'])
@login_required
def perfil():
    if request.method == 'POST':
        nome = request.form.get('nome')
        email = request.form.get('email')

        if not nome or not email:
            flash('Nome e Email são obrigatórios.', 'error')
        else:
            current_user.nome = nome
            current_user.email = email
            try:
                db.session.commit()
                flash('Perfil atualizado com sucesso!', 'success')
            except IntegrityError:
                db.session.rollback()
                flash('Email já está em uso.', 'error')

    return render_template('perfil.html', user=current_user)
