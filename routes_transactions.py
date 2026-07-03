from flask import Blueprint, render_template, request, redirect, url_for, flash, jsonify
from flask_login import login_required, current_user
from extensions import db, limiter
from models import Conta, Cliente, Transacao
from decimal import Decimal
from werkzeug.security import check_password_hash
from utils import gerar_recibo_pdf
from audit_service import log_audit
from schemas import transferencia_schema
from marshmallow import ValidationError

transactions_bp = Blueprint('transactions', __name__)

@transactions_bp.route('/transfer', methods=['GET', 'POST'])
@login_required
@limiter.limit("10 per hour")
def transferir():
    if request.method == 'POST':
        try:
            data = transferencia_schema.load(request.form)
        except ValidationError as err:
            for field, messages in err.messages.items():
                for msg in messages:
                    flash(f"{field}: {msg}", 'error')
            return redirect(url_for('transactions.transferir'))

        recipient_email = data['recipient']
        amount = data['amount']
        description = data['description']
        category = data['category']

        if current_user.senha_transacao:
            pin = request.form.get('pin')
            if not pin or not check_password_hash(current_user.senha_transacao, pin):
                 flash('Senha de transação incorreta.', 'error')
                 return redirect(url_for('transactions.transferir'))

        sender_account = Conta.query.filter_by(id_cliente=current_user.id_cliente).first()
        if not sender_account:
             flash('Conta do remetente não encontrada.', 'error')
             return redirect(url_for('transactions.transferir'))

        recipient_client = Cliente.query.filter_by(email=recipient_email).first()
        if not recipient_client:
            flash('Destinatário não encontrado.', 'error')
            return redirect(url_for('transactions.transferir'))

        recipient_account = Conta.query.filter_by(id_cliente=recipient_client.id_cliente).first()
        if not recipient_account:
            flash('Conta do destinatário não encontrada.', 'error')
            return redirect(url_for('transactions.transferir'))

        if sender_account.saldo < amount:
            flash('Saldo insuficiente.', 'error')
            return redirect(url_for('transactions.transferir'))

        try:
            sender_account.saldo -= amount
            recipient_account.saldo += amount

            tx_out = Transacao(
                numero_conta=sender_account.numero_conta,
                tipo_transacao='Transferência Enviada',
                valor=-amount,
                descricao=f"Para {recipient_client.nome}: {description}",
                categoria=category
            )
            tx_in = Transacao(
                numero_conta=recipient_account.numero_conta,
                tipo_transacao='Transferência Recebida',
                valor=amount,
                descricao=f"De {current_user.nome}: {description}",
                categoria='Transferência'
            )

            db.session.add(tx_out)
            db.session.add(tx_in)
            log_audit('Transferência', f"Enviado {amount} para {recipient_email}")
            db.session.commit()

            flash('Transferência realizada com sucesso!', 'success')
            return redirect(url_for('index'))

        except Exception as e:
            db.session.rollback()
            flash(f'Erro na transferência: {str(e)}', 'error')
            return redirect(url_for('transactions.transferir'))

    conta = Conta.query.filter_by(id_cliente=current_user.id_cliente).first()
    saldo = conta.saldo if conta else 0.00
    return render_template('transfer.html', saldo=saldo)

@transactions_bp.route('/historico')
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

@transactions_bp.route('/recibo/<int:id_transacao>')
@login_required
def download_recibo(id_transacao):
    conta = Conta.query.filter_by(id_cliente=current_user.id_cliente).first()
    transacao = Transacao.query.filter_by(id_transacao=id_transacao, numero_conta=conta.numero_conta).first()

    if not transacao:
        flash('Transação não encontrada.', 'error')
        return redirect(url_for('transactions.historico'))

    return gerar_recibo_pdf(transacao, current_user)

@transactions_bp.route('/boleto')
@login_required
def pagar_boleto_page():
    conta = Conta.query.filter_by(id_cliente=current_user.id_cliente).first()
    saldo = conta.saldo if conta else 0.00
    return render_template('boleto.html', saldo=saldo)

@transactions_bp.route('/pagamento_boleto', methods=['POST'])
@login_required
def pagamento_boleto():
    valor = request.form['valor']
    try:
        valor = Decimal(valor)
        if valor <= 0:
            flash('O valor deve ser maior que zero.', 'error')
            return redirect(url_for('transactions.pagar_boleto_page'))
    except ValueError:
        flash('Valor inválido.', 'error')
        return redirect(url_for('transactions.pagar_boleto_page'))

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
            flash('Boleto pago com sucesso!', 'success')
            return redirect(url_for('index'))
        except Exception as e:
            db.session.rollback()
            return jsonify({'message': f'Erro: {str(e)}'}), 500
    else:
        return jsonify({'message': 'Saldo insuficiente ou conta não encontrada.'}), 400

@transactions_bp.route('/deposito', methods=['GET', 'POST'])
@login_required
def deposito():
    if request.method == 'POST':
        valor = request.form['valor']
        try:
            valor = Decimal(valor)
            if valor <= 0:
                flash('O valor deve ser maior que zero.', 'error')
                return redirect(url_for('transactions.deposito'))
        except ValueError:
            flash('Valor inválido.', 'error')
            return redirect(url_for('transactions.deposito'))

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
                flash('Depósito realizado com sucesso!', 'success')
                return redirect(url_for('index'))
            except Exception as e:
                db.session.rollback()
                return jsonify({'message': f'Erro: {str(e)}'}), 500
        else:
             return jsonify({'message': 'Conta não encontrada.'}), 404

    conta = Conta.query.filter_by(id_cliente=current_user.id_cliente).first()
    saldo = conta.saldo if conta else 0.00
    return render_template('deposito.html', saldo=saldo)

@transactions_bp.route('/saque', methods=['GET', 'POST'])
@login_required
def saque():
    if request.method == 'POST':
        valor = request.form['valor']
        try:
            valor = Decimal(valor)
            if valor <= 0:
                flash('O valor deve ser maior que zero.', 'error')
                return redirect(url_for('transactions.saque'))
        except ValueError:
            flash('Valor inválido.', 'error')
            return redirect(url_for('transactions.saque'))

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
                flash('Saque realizado com sucesso!', 'success')
                return redirect(url_for('index'))
            except Exception as e:
                 db.session.rollback()
                 return jsonify({'message': f'Erro: {str(e)}'}), 500
        else:
            return jsonify({'message': 'Saldo insuficiente.'}), 400

    conta = Conta.query.filter_by(id_cliente=current_user.id_cliente).first()
    saldo = conta.saldo if conta else 0.00
    return render_template('saque.html', saldo=saldo)

@transactions_bp.route('/recarga', methods=['GET', 'POST'])
@login_required
def recarga():
    if request.method == 'POST':
        operadora = request.form.get('operadora')
        telefone = request.form.get('telefone')
        valor = Decimal(request.form.get('valor'))

        if current_user.senha_transacao:
            pin = request.form.get('pin')
            if not pin or not check_password_hash(current_user.senha_transacao, pin):
                 flash('Senha de transação incorreta.', 'error')
                 return redirect(url_for('transactions.recarga'))

        conta = Conta.query.filter_by(id_cliente=current_user.id_cliente).first()
        if conta.saldo < valor:
             flash('Saldo insuficiente.', 'error')
             return redirect(url_for('transactions.recarga'))

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

    conta = Conta.query.filter_by(id_cliente=current_user.id_cliente).first()
    saldo = conta.saldo if conta else 0.00
    return render_template('recarga.html', saldo=saldo)

@transactions_bp.route('/transactions/recent')
@login_required
def recent_transactions():
    conta = Conta.query.filter_by(id_cliente=current_user.id_cliente).first()
    if not conta:
        return ""

    transacoes_recentes = Transacao.query.filter_by(numero_conta=conta.numero_conta)\
            .order_by(Transacao.data_transacao.desc())\
            .limit(5).all()

    return render_template('_recent_transactions.html', transacoes_recentes=transacoes_recentes)

@transactions_bp.route('/saldo/<int:numero_conta>', methods=['GET'])
@login_required
def saldo(numero_conta):
    conta = Conta.query.filter_by(numero_conta=numero_conta).first()
    if conta and conta.id_cliente == current_user.id_cliente:
        return jsonify({'saldo': float(conta.saldo)})
    return jsonify({'message': 'Conta não encontrada ou acesso negado.'}), 403
