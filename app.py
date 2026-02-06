from flask import Flask, render_template, request, redirect, url_for, session, flash, jsonify
from werkzeug.security import generate_password_hash, check_password_hash
from datetime import date, datetime
import random
from decimal import Decimal
from extensions import db
from config import Config
from models import Cliente, Conta, Transacao, Emprestimo, Cartao, ChavePix
from flask_login import LoginManager, login_user, login_required, logout_user, current_user
from sqlalchemy.exc import IntegrityError
from flask_wtf.csrf import CSRFProtect
from utils import gerar_recibo_pdf

app = Flask(__name__)
app.config.from_object(Config)

csrf = CSRFProtect(app)
db.init_app(app)
login_manager = LoginManager()
login_manager.init_app(app)
login_manager.login_view = 'login'

from routes_pix import pix_bp
app.register_blueprint(pix_bp)

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
        new_cliente = Cliente(nome=nome, cpf=cpf, email=email, senha=senha_hash)
        db.session.add(new_cliente)
        db.session.flush() # flush to get id_cliente

        # Create Account
        new_conta = Conta(
            id_cliente=new_cliente.id_cliente,
            saldo=0.00,
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

    return render_template('index.html', saldo=saldo, user=current_user, entradas=entradas, saidas=saidas)


@app.route('/extrato')
@login_required
def extrato():
    return render_template('extrato.html')


@app.route('/transfer', methods=['GET', 'POST'])
@login_required
def transferir():
    if request.method == 'POST':
        recipient_email = request.form.get('recipient')
        try:
            amount = Decimal(request.form.get('amount'))
        except:
            flash('Valor inválido.', 'error')
            return redirect(url_for('transferir'))

        description = request.form.get('description')
        category = request.form.get('category', 'Outros')

        if amount <= 0:
            flash('Valor de transferência deve ser positivo.', 'error')
            return redirect(url_for('transferir'))

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
    with app.app_context():
        db.create_all()
    app.run(debug=True)
