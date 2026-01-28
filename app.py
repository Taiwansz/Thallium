from flask import Flask, render_template, request, redirect, url_for, session, flash, jsonify
from werkzeug.security import generate_password_hash, check_password_hash
from flask_login import login_user, logout_user, login_required, current_user
from config import Config
from extensions import db, login_manager
from models import Cliente, Conta, Cartao, Transacao, Emprestimo
from forms import LoginForm, RegisterForm, TransferForm, DepositForm, WithdrawForm, BoletoForm, LoanForm
from datetime import date, datetime, timedelta
import random

def create_app():
    app = Flask(__name__)
    app.config.from_object(Config)

    db.init_app(app)
    login_manager.init_app(app)
    login_manager.login_view = 'login'

    return app

app = create_app()

@login_manager.user_loader
def load_user(user_id):
    return db.session.get(Cliente, int(user_id))

@app.route('/')
def home():
    if current_user.is_authenticated:
        return redirect(url_for('index'))
    return redirect(url_for('login'))

@app.route('/login', methods=['GET', 'POST'])
def login():
    if current_user.is_authenticated:
        return redirect(url_for('index'))

    form = LoginForm()
    if form.validate_on_submit():
        user = Cliente.query.filter_by(email=form.email.data).first()
        if user and check_password_hash(user.senha, form.password.data):
            login_user(user)
            return redirect(url_for('index'))
        else:
            flash('Login ou senha inválidos.', 'error')

    return render_template('login.html', form=form)

@app.route('/logout')
@login_required
def logout():
    logout_user()
    return redirect(url_for('login'))

@app.route('/cadastro', methods=['GET', 'POST'])
def cadastro():
    if current_user.is_authenticated:
        return redirect(url_for('index'))

    form = RegisterForm()
    if form.validate_on_submit():
        hashed_password = generate_password_hash(form.password.data)
        cliente = Cliente(
            nome=form.nome.data,
            cpf=form.cpf.data,
            email=form.email.data,
            senha=hashed_password
        )
        db.session.add(cliente)
        db.session.commit()

        # Create Account
        conta = Conta(
            id_cliente=cliente.id_cliente,
            tipo_conta='Corrente',
            data_abertura=date.today(),
            saldo=0.00
        )
        db.session.add(conta)
        db.session.commit()

        # Create Card
        def gerar_numero_cartao():
            return ''.join([str(random.randint(0, 9)) for _ in range(16)])

        numero_cartao = gerar_numero_cartao()
        while Cartao.query.filter_by(numero=numero_cartao).first():
             numero_cartao = gerar_numero_cartao()

        validade = f"{random.randint(1, 12):02d}/{random.randint(25, 30)}"
        cvv = f"{random.randint(100, 999)}"

        cartao = Cartao(
            numero=numero_cartao,
            validade=validade,
            cvv=cvv,
            id_cliente=cliente.id_cliente
        )
        db.session.add(cartao)
        db.session.commit()

        flash('Conta criada com sucesso! Faça login.', 'success')
        return redirect(url_for('login'))

    return render_template('register.html', form=form)

@app.route('/index')
@login_required
def index():
    conta = Conta.query.filter_by(id_cliente=current_user.id_cliente).first()
    saldo = conta.saldo if conta else 0.00
    return render_template('index.html', saldo=saldo)

@app.route('/extrato')
@login_required
def extrato():
    conta = Conta.query.filter_by(id_cliente=current_user.id_cliente).first()
    if not conta:
        flash('Conta não encontrada.', 'error')
        return redirect(url_for('index'))

    transacoes = Transacao.query.filter_by(numero_conta=conta.numero_conta).order_by(Transacao.data_transacao.desc()).all()
    return render_template('historico.html', transacoes=transacoes)

@app.route('/transfer', methods=['GET', 'POST'])
@login_required
def transferir():
    form = TransferForm()
    if form.validate_on_submit():
        recipient = Cliente.query.filter_by(email=form.recipient_email.data).first()
        if not recipient:
            flash('Destinatário não encontrado.', 'error')
            return render_template('transfer.html', form=form)

        sender_conta = Conta.query.filter_by(id_cliente=current_user.id_cliente).first()
        recipient_conta = Conta.query.filter_by(id_cliente=recipient.id_cliente).first()

        if not recipient_conta:
             flash('Conta do destinatário não encontrada.', 'error')
             return render_template('transfer.html', form=form)

        if sender_conta.saldo < form.amount.data:
            flash('Saldo insuficiente.', 'error')
            return render_template('transfer.html', form=form)

        try:
            sender_conta.saldo = float(sender_conta.saldo) - float(form.amount.data)
            recipient_conta.saldo = float(recipient_conta.saldo) + float(form.amount.data)

            transacao_sender = Transacao(
                numero_conta=sender_conta.numero_conta,
                tipo_transacao='Transferência Enviada',
                valor=-form.amount.data,
                descricao=f"Para: {recipient.email} - {form.description.data or ''}"
            )

            transacao_recipient = Transacao(
                numero_conta=recipient_conta.numero_conta,
                tipo_transacao='Transferência Recebida',
                valor=form.amount.data,
                descricao=f"De: {current_user.email} - {form.description.data or ''}"
            )

            db.session.add(transacao_sender)
            db.session.add(transacao_recipient)
            db.session.commit()

            flash('Transferência realizada com sucesso!', 'success')
            return redirect(url_for('index'))
        except Exception as e:
            db.session.rollback()
            flash(f'Erro na transferência: {str(e)}', 'error')

    return render_template('transfer.html', form=form)

@app.route('/boleto', methods=['GET', 'POST'])
@login_required
def pagar():
    form = BoletoForm()
    if form.validate_on_submit():
        conta = Conta.query.filter_by(id_cliente=current_user.id_cliente).first()
        if conta.saldo < form.amount.data:
            flash('Saldo insuficiente.', 'error')
        else:
            try:
                conta.saldo = float(conta.saldo) - float(form.amount.data)
                transacao = Transacao(
                    numero_conta=conta.numero_conta,
                    tipo_transacao='Pagamento Boleto',
                    valor=-form.amount.data,
                    descricao='Pagamento de Boleto'
                )
                db.session.add(transacao)
                db.session.commit()
                flash('Boleto pago com sucesso!', 'success')
                return redirect(url_for('index'))
            except Exception as e:
                db.session.rollback()
                flash(f'Erro: {str(e)}', 'error')

    return render_template('boleto.html', form=form)

@app.route('/pagamento_boleto', methods=['POST'])
@login_required
def pagamento_boleto():
    return redirect(url_for('pagar'))

@app.route('/deposito', methods=['GET', 'POST'])
@login_required
def deposito():
    form = DepositForm()
    if form.validate_on_submit():
        conta = Conta.query.filter_by(id_cliente=current_user.id_cliente).first()
        try:
            conta.saldo = float(conta.saldo) + float(form.amount.data)
            transacao = Transacao(
                numero_conta=conta.numero_conta,
                tipo_transacao='Depósito',
                valor=form.amount.data,
                descricao='Depósito realizado'
            )
            db.session.add(transacao)
            db.session.commit()
            flash('Depósito realizado com sucesso!', 'success')
            return redirect(url_for('index'))
        except Exception as e:
             db.session.rollback()
             flash(f'Erro: {str(e)}', 'error')

    return render_template('deposito.html', form=form)

@app.route('/saque', methods=['GET', 'POST'])
@login_required
def saque():
    form = WithdrawForm()
    if form.validate_on_submit():
        conta = Conta.query.filter_by(id_cliente=current_user.id_cliente).first()
        if conta.saldo < form.amount.data:
            flash('Saldo insuficiente.', 'error')
        else:
            try:
                conta.saldo = float(conta.saldo) - float(form.amount.data)
                transacao = Transacao(
                    numero_conta=conta.numero_conta,
                    tipo_transacao='Saque',
                    valor=-form.amount.data,
                    descricao='Saque realizado'
                )
                db.session.add(transacao)
                db.session.commit()
                flash('Saque realizado com sucesso!', 'success')
                return redirect(url_for('index'))
            except Exception as e:
                db.session.rollback()
                flash(f'Erro: {str(e)}', 'error')

    return render_template('saque.html', form=form)

@app.route('/emprestimo', methods=['GET', 'POST'])
@login_required
def emprestimo():
    form = LoanForm()
    if form.validate_on_submit():
        conta = Conta.query.filter_by(id_cliente=current_user.id_cliente).first()
        juros = 1.05
        data_emp = date.today()
        data_venc = data_emp + timedelta(days=30*form.prazo.data)

        emp = Emprestimo(
            numero_conta=conta.numero_conta,
            valor_emprestimo=form.amount.data,
            juros=juros,
            prazo=form.prazo.data,
            data_emprestimo=data_emp,
            data_vencimento=data_venc,
            status='pendente'
        )
        db.session.add(emp)
        db.session.commit()
        return redirect(url_for('confirmacao'))

    return render_template('emprestimo.html', form=form)

@app.route('/emprestimo/confirmacao')
@login_required
def confirmacao():
    return render_template('confirmacao.html', mensagem="Seu pedido de empréstimo foi enviado com sucesso!")

@app.route('/cartoes')
@login_required
def cartoes():
    cartoes_list = Cartao.query.filter_by(id_cliente=current_user.id_cliente).all()
    return render_template('cartoes.html', cartoes=cartoes_list)

@app.route('/sucesso')
def sucesso():
    return "Ação realizada com sucesso!"

@app.route('/erro')
def pagina_erro():
    return "Ocorreu um erro."

if __name__ == '__main__':
    app.run(debug=True)
