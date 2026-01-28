from flask import Blueprint, render_template, request, redirect, url_for, session, flash, jsonify
from app.services.auth_service import AuthService

bp = Blueprint('auth', __name__)

@bp.route('/')
def home():
    return render_template('login.html')

@bp.route('/login', methods=['GET', 'POST'])
def login():
    if request.method == 'POST':
        email = request.form['email']
        password = request.form['password']

        try:
            user = AuthService.authenticate(email, password)
            session['user_email'] = email
            session['username'] = user['nome']
            session['id_cliente'] = user['id_cliente']
            return redirect(url_for('main.index'))
        except ValueError as e:
            flash(str(e), 'error')
            return render_template('login.html')

    return render_template('login.html')

@bp.route('/logout')
def logout():
    session.clear()
    return redirect(url_for('auth.login'))

@bp.route('/cadastro')
def cadastro():
    return render_template('register.html')

@bp.route('/cadastrar_cliente', methods=['POST'])
def cadastrar_cliente():
    data = request.json
    try:
        result = AuthService.register_user(
            data.get('nome'),
            data.get('cpf'),
            data.get('email'),
            data.get('senha')
        )
        result['message'] = 'Cliente, conta e cartão cadastrados com sucesso!'
        return jsonify(result)
    except ValueError as e:
        return jsonify({'message': str(e)}), 400
    except Exception as e:
        return jsonify({'message': str(e)}), 500
