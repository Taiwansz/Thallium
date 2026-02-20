from flask import Flask, render_template, request, redirect, url_for, session, flash, jsonify
from werkzeug.security import generate_password_hash, check_password_hash
from datetime import date, datetime
import random
from decimal import Decimal
from extensions import db, migrate, limiter, ma, swagger, mail
from config import Config
from models import Cliente, Conta, Transacao, Emprestimo, Cartao, ChavePix, Investimento, AuditLog, VerificationCode
from flask_login import LoginManager, login_user, login_required, logout_user, current_user
from sqlalchemy.exc import IntegrityError
from flask_wtf.csrf import CSRFProtect
from utils import gerar_recibo_pdf
from audit_service import log_audit
from schemas import transferencia_schema
from marshmallow import ValidationError
from jobs import yield_daily_command
from seed import seed_admin_command
from email_service import send_verification_email, verify_code

app = Flask(__name__)
app.cli.add_command(yield_daily_command)
app.cli.add_command(seed_admin_command)
app.config.from_object(Config)

# Ensure instance folder exists for SQLite fallback
import os
try:
    os.makedirs(app.instance_path)
except OSError:
    pass

csrf = CSRFProtect(app)
db.init_app(app)
migrate.init_app(app, db)
limiter.init_app(app)
ma.init_app(app)
swagger.init_app(app)
mail.init_app(app)

# Auto-migration fallback for SQLite (Render ephemeral FS)
from sqlalchemy import inspect, text
from flask_migrate import upgrade

with app.app_context():
    try:
        inspector = inspect(db.engine)

        # 1. Manual Patching for Broken/Partial Schemas (Common in SQLite Dev/Render)
        if inspector.has_table("Clientes"):
            columns = [c['name'] for c in inspector.get_columns("Clientes")]
            if "is_active" not in columns:
                print("--> Patching 'Clientes': Adding missing 'is_active' column...")
                with db.engine.connect() as conn:
                    conn.execute(text("ALTER TABLE Clientes ADD COLUMN is_active BOOLEAN DEFAULT 1"))
                    conn.commit()

        if not inspector.has_table("verification_codes"):
             print("--> Patching: Creating missing 'verification_codes' table logic handled by upgrade, but forcing if needed...")
             # Let upgrade handle create table, but if upgrade fails due to other table existing...
             pass

        # 2. Run Standard Migrations
        print("--> Running Alembic migrations...")
        upgrade()
        print("--> Database schema synced.")

    except Exception as e:
        print(f"--> Auto-migration/Patching warning: {e}")
        # Proceed anyway, hoping for the best

login_manager = LoginManager()
login_manager.init_app(app)
login_manager.login_view = 'login'

from routes_pix import pix_bp
app.register_blueprint(pix_bp)

from api import api_bp
app.register_blueprint(api_bp)

@login_manager.user_loader
def load_user(user_id):
    return db.session.get(Cliente, int(user_id))

def validate_cpf(cpf):
    # Basic format check
    cpf = ''.join(filter(str.isdigit, cpf))
    if len(cpf) != 11:
        return False
    if cpf == cpf[0] * 11:
        return False

    # Check digits
    for i in range(9, 11):
        val = sum((int(cpf[num]) * ((i + 1) - num) for num in range(0, i)))
        digit = ((val * 10) % 11) % 10
        if digit != int(cpf[i]):
            return False
    return True

@app.template_filter('currency')
def currency_filter(value):
    if value is None: return "R$ 0,00"
    return "R$ {:,.2f}".format(value).replace('.', 'X').replace(',', '.').replace('X', ',')

@app.template_filter('datetime')
def datetime_filter(value):
    if value is None: return ""
    return value.strftime('%d/%m/%Y %H:%M')

@app.errorhandler(404)
def page_not_found(e):
    return render_template('404.html'), 404

@app.errorhandler(500)
def internal_server_error(e):
    return render_template('500.html'), 500

@app.route('/')
def home():
    if current_user.is_authenticated:
        return redirect(url_for('index'))
    return render_template('login.html')

@app.route('/cadastrar_cliente', methods=['POST'])
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

    # Hash da senha
    senha_hash = generate_password_hash(senha)

    try:
        # Create Inactive Client
        new_cliente = Cliente(
            nome=nome,
            cpf=cpf,
            email=email,
            senha=senha_hash,
            is_active=False # Wait for email verification
        )
        db.session.add(new_cliente)
        db.session.flush()

        # Create Account & Card (Inactive state handled by user login block? No, just create them)
        # Random initial balance between 100 and 10000
        saldo_inicial = Decimal(random.uniform(100, 10000)).quantize(Decimal('0.01'))

        new_conta = Conta(
            id_cliente=new_cliente.id_cliente,
            saldo=saldo_inicial,
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

        # Send Verification Email
        send_verification_email(email, 'register')

        # Store email in session for the next step
        session['pending_email'] = email

        return jsonify({
            'message': 'Cadastro realizado! Verifique seu email para ativar a conta.',
            'redirect': url_for('verificar_email')
        })

    except IntegrityError:
        db.session.rollback()
        return jsonify({'message': 'Erro ao cadastrar: CPF ou email já existe.'}), 400
    except Exception as e:
        db.session.rollback()
        return jsonify({'message': f'Erro inesperado: {str(e)}'}), 500


@app.route('/index')
@login_required
def index():
    # Assuming user has at least one account. In a real app, handle multiple or none.
    conta = Conta.query.filter_by(id_cliente=current_user.id_cliente).first()
    saldo = conta.saldo if conta else 0.00

    entradas = 0.0
    saidas = 0.0

    if conta:
        transacoes = Transacao.query.filter_by(numero_conta=conta.numero_conta).all()
        for t in transacoes:
            if t.valor > 0:
                entradas += float(t.valor)
            else:
                saidas += abs(float(t.valor))

    # Calculate Total Investments
    investimentos_ativos = Investimento.query.filter_by(id_cliente=current_user.id_cliente, resgatado=False).all()
    total_investido = sum([i.valor_inicial for i in investimentos_ativos])

    # Calculate Total Patrimony
    patrimonio_total = Decimal(saldo) + total_investido

    return render_template('index.html',
                           saldo=saldo,
                           user=current_user,
                           entradas=entradas,
                           saidas=saidas,
                           total_investido=total_investido,
                           patrimonio_total=patrimonio_total)

@app.route('/transactions/recent')
@login_required
def recent_transactions():
    conta = Conta.query.filter_by(id_cliente=current_user.id_cliente).first()
    if not conta:
        return ""

    transacoes_recentes = Transacao.query.filter_by(numero_conta=conta.numero_conta)\
            .order_by(Transacao.data_transacao.desc())\
            .limit(5).all()

    return render_template('_recent_transactions.html', transacoes_recentes=transacoes_recentes)

@app.route('/extrato')
@login_required
def extrato():
    return render_template('extrato.html')


@app.route('/transfer', methods=['GET', 'POST'])
@login_required
@limiter.limit("10 per hour")
def transferir():
    if request.method == 'POST':
        # Validation
        try:
            data = transferencia_schema.load(request.form)
        except ValidationError as err:
            for field, messages in err.messages.items():
                for msg in messages:
                    flash(f"{field}: {msg}", 'error')
            return redirect(url_for('transferir'))

        recipient_email = data['recipient']
        amount = data['amount']
        description = data['description']
        category = data['category']

        # Verify Transaction Password if set
        if current_user.senha_transacao:
            pin = request.form.get('pin')
            if not pin or not check_password_hash(current_user.senha_transacao, pin):
                 flash('Senha de transação incorreta.', 'error')
                 return redirect(url_for('transferir'))

        sender_account = Conta.query.filter_by(id_cliente=current_user.id_cliente).first()
        if not sender_account:
             flash('Conta do remetente não encontrada.', 'error')
             return redirect(url_for('transferir'))

        recipient_client = Cliente.query.filter_by(email=recipient_email).first()
        if not recipient_client:
            flash('Destinatário não encontrado.', 'error')
            return redirect(url_for('transferir'))

        recipient_account = Conta.query.filter_by(id_cliente=recipient_client.id_cliente).first()
        if not recipient_account:
            flash('Conta do destinatário não encontrada.', 'error')
            return redirect(url_for('transferir'))

        if sender_account.saldo < amount:
            flash('Saldo insuficiente.', 'error')
            return redirect(url_for('transferir'))

        try:
            sender_account.saldo -= amount
            recipient_account.saldo += amount # type: ignore

            # Transação de saída (Remetente)
            tx_out = Transacao(
                numero_conta=sender_account.numero_conta,
                tipo_transacao='Transferência Enviada',
                valor=-amount,
                descricao=f"Para {recipient_client.nome}: {description}",
                categoria=category
            )
            # Transação de entrada (Destinatário)
            tx_in = Transacao(
                numero_conta=recipient_account.numero_conta,
                tipo_transacao='Transferência Recebida',
                valor=amount,
                descricao=f"De {current_user.nome}: {description}",
                categoria='Transferência'
            )

            db.session.add(tx_out)
            db.session.add(tx_in)

            # Audit Log
            log_audit('Transferência', f"Enviado {amount} para {recipient_email}")

            db.session.commit()

            flash('Transferência realizada com sucesso!', 'success')
            return redirect(url_for('index'))

        except Exception as e:
            db.session.rollback()
            flash(f'Erro na transferência: {str(e)}', 'error')
            return redirect(url_for('transferir'))

    return render_template('transfer.html')


@app.route('/historico')
@login_required
def historico():
    page = request.args.get('page', 1, type=int)
    conta = Conta.query.filter_by(id_cliente=current_user.id_cliente).first()
    if not conta:
        flash('Conta não encontrada.', 'error')
        return redirect(url_for('index'))

    pagination = Transacao.query.filter_by(numero_conta=conta.numero_conta)\
        .order_by(Transacao.data_transacao.desc())\
        .paginate(page=page, per_page=10, error_out=False)

    transacoes = pagination.items
    return render_template('historico.html', transacoes=transacoes, pagination=pagination)

@app.route('/recibo/<int:id_transacao>')
@login_required
def download_recibo(id_transacao):
    conta = Conta.query.filter_by(id_cliente=current_user.id_cliente).first()
    transacao = Transacao.query.filter_by(id_transacao=id_transacao, numero_conta=conta.numero_conta).first()

    if not transacao:
        flash('Transação não encontrada.', 'error')
        return redirect(url_for('historico'))

    return gerar_recibo_pdf(transacao, current_user)


@app.route('/cadastro')
def cadastro():
    return render_template('register.html')

@app.route('/config_senha_transacao', methods=['GET', 'POST'])
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
            return redirect(url_for('perfil'))

    return render_template('config_senha_transacao.html')

@app.route('/perfil', methods=['GET', 'POST'])
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


@app.route('/boleto')
@login_required
def pagar():
    return render_template('boleto.html')


@app.route('/pagamento_boleto', methods=['POST'])
@login_required
def pagamento_boleto():
    valor = request.form['valor']
    try:
        valor = Decimal(valor)
        if valor <= 0:
            flash('O valor deve ser maior que zero.', 'error')
            return redirect(url_for('pagar'))
    except ValueError:
        flash('Valor inválido.', 'error')
        return redirect(url_for('pagar'))

    conta = Conta.query.filter_by(id_cliente=current_user.id_cliente).first()

    if conta and conta.saldo >= valor:
        try:
            conta.saldo -= valor
            tx = Transacao(
                numero_conta=conta.numero_conta,
                tipo_transacao='Pagamento Boleto',
                valor=-valor,
                descricao='Pagamento de boleto'
            )
            db.session.add(tx)
            db.session.commit()
            return redirect(url_for('index'))
        except Exception as e:
            db.session.rollback()
            return jsonify({'message': f'Erro: {str(e)}'}), 500
    else:
        return jsonify({'message': 'Saldo insuficiente ou conta não encontrada.'}), 400

    return render_template('pagamento_boleto.html')


@app.route('/sucesso')
def sucesso():
    return "Boleto pago com sucesso!"


@app.route('/login', methods=['GET', 'POST'])
@limiter.limit("10 per minute")
def login():
    if current_user.is_authenticated:
        return redirect(url_for('index'))

    if request.method == 'POST':
        email = request.form['email']
        password = request.form['password']

        user = Cliente.query.filter_by(email=email).first()

        if user and check_password_hash(user.senha, password):
            if user.is_active is False: # Check if None/True/False
                flash('Conta não ativada. Verifique seu email.', 'warning')
                session['pending_email'] = email
                return redirect(url_for('verificar_email'))

            login_user(user)
            return redirect(url_for('index'))
        else:
            flash('Usuário ou senha inválidos.', 'error')

    return render_template('login.html')

@app.route('/verificar-email', methods=['GET', 'POST'])
def verificar_email():
    email = session.get('pending_email')
    if not email:
        return redirect(url_for('login'))

    if request.method == 'POST':
        code = request.form.get('code')
        if verify_code(email, code, 'register'):
            user = Cliente.query.filter_by(email=email).first()
            if user:
                user.is_active = True
                db.session.commit()
                login_user(user)
                session.pop('pending_email', None)
                flash('Conta ativada com sucesso!', 'success')
                return redirect(url_for('index'))
        else:
            flash('Código inválido ou expirado.', 'error')

    return render_template('verify_email.html', email=email)

@app.route('/esqueci-senha', methods=['GET', 'POST'])
def esqueci_senha():
    if request.method == 'POST':
        email = request.form.get('email')
        user = Cliente.query.filter_by(email=email).first()
        if user:
            send_verification_email(email, 'reset')
            session['reset_email'] = email
            flash('Código enviado para seu email.', 'info')
            return redirect(url_for('redefinir_senha'))
        else:
            flash('Email não encontrado.', 'error')

    return render_template('forgot_password.html')

@app.route('/redefinir-senha', methods=['GET', 'POST'])
def redefinir_senha():
    email = session.get('reset_email')
    if not email:
        return redirect(url_for('esqueci_senha'))

    if request.method == 'POST':
        code = request.form.get('code')
        password = request.form.get('password')
        confirm = request.form.get('confirm_password')

        if password != confirm:
            flash('Senhas não conferem.', 'error')
        elif verify_code(email, code, 'reset'):
            user = Cliente.query.filter_by(email=email).first()
            if user:
                user.senha = generate_password_hash(password)
                db.session.commit()
                session.pop('reset_email', None)
                flash('Senha redefinida com sucesso! Faça login.', 'success')
                return redirect(url_for('login'))
        else:
            flash('Código inválido ou expirado.', 'error')

    return render_template('reset_password.html', email=email)


@app.route('/saldo/<int:numero_conta>', methods=['GET'])
@login_required
def saldo(numero_conta):
    conta = Conta.query.filter_by(numero_conta=numero_conta).first()
    # Security check: ensure the account belongs to the user
    if conta and conta.id_cliente == current_user.id_cliente:
        return jsonify({'saldo': conta.saldo})
    return jsonify({'message': 'Conta não encontrada ou acesso negado.'})


@app.route('/deposito', methods=['GET', 'POST'])
@login_required
def deposito():
    if request.method == 'POST':
        valor = request.form['valor']
        try:
            valor = Decimal(valor)
            if valor <= 0:
                flash('O valor deve ser maior que zero.', 'error')
                return redirect(url_for('deposito'))
        except ValueError:
            flash('Valor inválido.', 'error')
            return redirect(url_for('deposito'))

        conta = Conta.query.filter_by(id_cliente=current_user.id_cliente).first()
        if conta:
            try:
                conta.saldo += valor
                tx = Transacao(
                    numero_conta=conta.numero_conta,
                    tipo_transacao='Depósito',
                    valor=valor,
                    descricao='Depósito realizado'
                )
                db.session.add(tx)
                db.session.commit()
                return redirect(url_for('index'))
            except Exception as e:
                db.session.rollback()
                return jsonify({'message': f'Erro: {str(e)}'}), 500
        else:
             return jsonify({'message': 'Conta não encontrada.'}), 404

    return render_template('deposito.html')


@app.route('/cartoes')
@login_required
def cartoes():
    cartoes_list = Cartao.query.filter_by(id_cliente=current_user.id_cliente).all()
    return render_template('cartoes.html', cartoes=cartoes_list)

@app.route('/cartoes/bloquear/<int:id_cartao>', methods=['POST'])
@login_required
def bloquear_cartao(id_cartao):
    cartao = Cartao.query.filter_by(id=id_cartao, id_cliente=current_user.id_cliente).first()
    if cartao:
        cartao.bloqueado = True
        db.session.commit()
        flash('Cartão bloqueado com sucesso.', 'success')
    else:
        flash('Cartão não encontrado.', 'error')
    return redirect(url_for('cartoes'))

@app.route('/cartoes/pagar_fatura/<int:id_cartao>', methods=['POST'])
@login_required
def pagar_fatura(id_cartao):
    cartao = Cartao.query.filter_by(id=id_cartao, id_cliente=current_user.id_cliente).first()
    if not cartao:
        flash('Cartão não encontrado.', 'error')
        return redirect(url_for('cartoes'))

    try:
        valor = Decimal(request.form.get('valor'))
    except:
        flash('Valor inválido.', 'error')
        return redirect(url_for('cartoes'))

    if valor <= 0 or valor > cartao.limite_usado:
        flash('Valor inválido para pagamento.', 'error')
        return redirect(url_for('cartoes'))

    conta = Conta.query.filter_by(id_cliente=current_user.id_cliente).first()
    if conta.saldo < valor:
        flash('Saldo insuficiente na conta corrente.', 'error')
        return redirect(url_for('cartoes'))

    try:
        # Debit account
        conta.saldo -= valor

        # Credit card limit
        cartao.limite_usado -= valor

        # Transaction Log
        tx = Transacao(
            numero_conta=conta.numero_conta,
            tipo_transacao='Pagamento Fatura',
            valor=-valor,
            descricao=f"Pagamento Cartão final {cartao.numero[-4:]}",
            categoria='Pagamentos'
        )

        db.session.add(tx)
        db.session.commit()

        flash('Pagamento de fatura realizado com sucesso!', 'success')
    except Exception as e:
        db.session.rollback()
        flash(f'Erro ao processar pagamento: {str(e)}', 'error')

    return redirect(url_for('cartoes'))

@app.route('/investimentos')
@login_required
def investimentos():
    meus_investimentos = Investimento.query.filter_by(id_cliente=current_user.id_cliente, resgatado=False).all()

    # Simulate yield calculation (simplified)
    total_investido = Decimal(0)
    total_rendimento = Decimal(0)

    lista_com_rendimento = []

    for inv in meus_investimentos:
        dias_corridos = (datetime.utcnow() - inv.data_aplicacao).days
        # Formula: M = P * (1 + i)^t (daily rate simplified)
        # taxa_anual / 365 = daily rate
        taxa_diaria = (inv.taxa_anual / 100) / 365
        rendimento = inv.valor_inicial * (taxa_diaria * dias_corridos)
        valor_atual = inv.valor_inicial + rendimento

        total_investido += inv.valor_inicial
        total_rendimento += rendimento

        lista_com_rendimento.append({
            'obj': inv,
            'valor_atual': valor_atual,
            'rendimento': rendimento
        })

    return render_template('investimentos.html', investimentos=lista_com_rendimento, total_investido=total_investido, total_rendimento=total_rendimento)

@app.route('/investir', methods=['POST'])
@login_required
def investir():
    try:
        valor = Decimal(request.form.get('valor'))
        tipo = request.form.get('tipo')
    except:
        flash('Dados inválidos.', 'error')
        return redirect(url_for('investimentos'))

    if valor < 100:
         flash('Valor mínimo de R$ 100,00.', 'error')
         return redirect(url_for('investimentos'))

    conta = Conta.query.filter_by(id_cliente=current_user.id_cliente).first()
    if conta.saldo < valor:
         flash('Saldo insuficiente.', 'error')
         return redirect(url_for('investimentos'))

    try:
        conta.saldo -= valor
        tx = Transacao(
            numero_conta=conta.numero_conta,
            tipo_transacao='Aplicação',
            valor=-valor,
            descricao=f"Investimento em {tipo}",
            categoria='Investimentos'
        )
        inv = Investimento(
            id_cliente=current_user.id_cliente,
            tipo=tipo,
            valor_inicial=valor
        )

        db.session.add(tx)
        db.session.add(inv)
        db.session.commit()
        flash('Investimento realizado com sucesso!', 'success')
    except Exception as e:
        db.session.rollback()
        flash(f'Erro: {str(e)}', 'error')

    return redirect(url_for('investimentos'))

@app.route('/resgatar/<int:id_inv>', methods=['POST'])
@login_required
def resgatar(id_inv):
    inv = Investimento.query.filter_by(id=id_inv, id_cliente=current_user.id_cliente).first()
    if not inv or inv.resgatado:
         flash('Investimento não encontrado.', 'error')
         return redirect(url_for('investimentos'))

    # Calculate final value
    dias_corridos = (datetime.utcnow() - inv.data_aplicacao).days
    taxa_diaria = (inv.taxa_anual / 100) / 365
    rendimento = inv.valor_inicial * (taxa_diaria * dias_corridos)
    valor_final = inv.valor_inicial + rendimento

    conta = Conta.query.filter_by(id_cliente=current_user.id_cliente).first()

    try:
        inv.resgatado = True
        conta.saldo += valor_final
        tx = Transacao(
            numero_conta=conta.numero_conta,
            tipo_transacao='Resgate',
            valor=valor_final,
            descricao=f"Resgate {inv.tipo}",
            categoria='Investimentos'
        )
        db.session.add(tx)
        db.session.commit()
        flash(f'Resgate de R$ {valor_final:,.2f} realizado!', 'success')
    except Exception as e:
        db.session.rollback()
        flash(f'Erro: {str(e)}', 'error')

    return redirect(url_for('investimentos'))

@app.route('/recarga', methods=['GET', 'POST'])
@login_required
def recarga():
    if request.method == 'POST':
        operadora = request.form.get('operadora')
        telefone = request.form.get('telefone')
        valor = Decimal(request.form.get('valor'))

        # Verify PIN
        if current_user.senha_transacao:
            pin = request.form.get('pin')
            if not pin or not check_password_hash(current_user.senha_transacao, pin):
                 flash('Senha de transação incorreta.', 'error')
                 return redirect(url_for('recarga'))

        conta = Conta.query.filter_by(id_cliente=current_user.id_cliente).first()
        if conta.saldo < valor:
             flash('Saldo insuficiente.', 'error')
             return redirect(url_for('recarga'))

        try:
            conta.saldo -= valor
            tx = Transacao(
                numero_conta=conta.numero_conta,
                tipo_transacao='Recarga Celular',
                valor=-valor,
                descricao=f"Recarga {operadora} - {telefone}",
                categoria='Telefonia'
            )
            db.session.add(tx)
            db.session.commit()
            flash(f'Recarga de R$ {valor} efetuada com sucesso!', 'success')
            return redirect(url_for('index'))
        except Exception as e:
            db.session.rollback()
            flash(f'Erro: {str(e)}', 'error')

    return render_template('recarga.html')

@app.route('/cartoes/desbloquear/<int:id_cartao>', methods=['POST'])
@login_required
def desbloquear_cartao(id_cartao):
    cartao = Cartao.query.filter_by(id=id_cartao, id_cliente=current_user.id_cliente).first()
    if cartao:
        cartao.bloqueado = False
        db.session.commit()
        flash('Cartão desbloqueado com sucesso.', 'success')
    else:
        flash('Cartão não encontrado.', 'error')
    return redirect(url_for('cartoes'))


@app.route('/erro')
def pagina_erro():
    return "Erro inesperado."


@app.route('/logout')
@login_required
def logout():
    logout_user()
    return redirect(url_for('login'))


@app.route('/saque', methods=['GET', 'POST'])
@login_required
def saque():
    if request.method == 'POST':
        valor = request.form['valor']
        try:
            valor = Decimal(valor)
            if valor <= 0:
                flash('O valor deve ser maior que zero.', 'error')
                return redirect(url_for('saque'))
        except ValueError:
            flash('Valor inválido.', 'error')
            return redirect(url_for('saque'))

        conta = Conta.query.filter_by(id_cliente=current_user.id_cliente).first()
        if conta and conta.saldo >= valor:
            try:
                conta.saldo -= valor
                tx = Transacao(
                    numero_conta=conta.numero_conta,
                    tipo_transacao='Saque',
                    valor=-valor,
                    descricao='Saque realizado'
                )
                db.session.add(tx)
                db.session.commit()
                return redirect(url_for('index'))
            except Exception as e:
                 db.session.rollback()
                 return jsonify({'message': f'Erro: {str(e)}'}), 500
        else:
            return jsonify({'message': 'Saldo insuficiente.'}), 400

    return render_template('saque.html')


@app.route('/emprestimo', methods=['GET', 'POST'])
@login_required
def emprestimo():
    if request.method == 'POST':
        try:
            valor_emprestimo = Decimal(request.form['valor_emprestimo'])
            prazo = int(request.form['prazo'])
        except ValueError:
             flash('Valores inválidos.', 'error')
             return redirect(url_for('emprestimo'))

        conta = Conta.query.filter_by(id_cliente=current_user.id_cliente).first()

        if conta:
            juros = Decimal('1.05')
            data_emprestimo = date.today()
            data_vencimento = data_emprestimo.replace(year=data_emprestimo.year + 1)

            emprestimo = Emprestimo(
                numero_conta=conta.numero_conta,
                valor_emprestimo=valor_emprestimo,
                juros=juros,
                prazo=prazo,
                data_emprestimo=data_emprestimo,
                data_vencimento=data_vencimento,
                status='pendente'
            )
            db.session.add(emprestimo)
            db.session.commit()
            return redirect(url_for('confirmacao'))
        else:
            return jsonify({'message': 'Conta não encontrada'}), 404

    return render_template('emprestimo.html')


@app.route('/emprestimo/confirmacao')
@login_required
def confirmacao():
    return render_template('confirmacao.html', mensagem="Seu pedido de empréstimo foi enviado com sucesso!")

if __name__ == '__main__':
    app.run(debug=True)
