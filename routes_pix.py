from flask import Blueprint, render_template, request, flash, redirect, url_for
from flask_login import login_required, current_user
from extensions import db
from models import ChavePix, Cliente, Conta, Transacao
from decimal import Decimal
from werkzeug.security import check_password_hash
import random
import string

pix_bp = Blueprint('pix', __name__)

@pix_bp.route('/pix')
@login_required
def dashboard():
    chaves = ChavePix.query.filter_by(id_cliente=current_user.id_cliente).all()
    return render_template('pix/dashboard.html', chaves=chaves)

@pix_bp.route('/pix/cadastrar', methods=['POST'])
@login_required
def cadastrar_chave():
    tipo = request.form.get('tipo')
    chave = request.form.get('chave')

    if not tipo:
        flash('Selecione um tipo de chave.', 'error')
        return redirect(url_for('pix.dashboard'))

    if tipo == 'aleatoria':
        chave = ''.join(random.choices(string.ascii_letters + string.digits, k=32))
    elif not chave:
        flash('Informe a chave.', 'error')
        return redirect(url_for('pix.dashboard'))

    # Check valid key
    if ChavePix.query.filter_by(chave=chave).first():
         flash('Chave Pix já cadastrada.', 'error')
         return redirect(url_for('pix.dashboard'))

    nova_chave = ChavePix(tipo=tipo, chave=chave, id_cliente=current_user.id_cliente)
    db.session.add(nova_chave)
    db.session.commit()
    flash(f'Chave {tipo} cadastrada com sucesso!', 'success')
    return redirect(url_for('pix.dashboard'))

@pix_bp.route('/pix/pagar', methods=['GET', 'POST'])
@login_required
def pagar():
    if request.method == 'POST':
        chave_dest = request.form.get('chave')
        valor_str = request.form.get('valor')
        pin = request.form.get('pin')

        try:
            valor = Decimal(valor_str)
        except:
             flash('Valor inválido.', 'error')
             return redirect(url_for('pix.pagar'))

        if valor <= 0:
             flash('Valor deve ser positivo.', 'error')
             return redirect(url_for('pix.pagar'))

        # Verify PIN
        if current_user.senha_transacao:
            if not pin or not check_password_hash(current_user.senha_transacao, pin):
                 flash('Senha de transação incorreta.', 'error')
                 return redirect(url_for('pix.pagar'))

        dest_chave_obj = ChavePix.query.filter_by(chave=chave_dest).first()
        if not dest_chave_obj:
            flash('Chave Pix não encontrada.', 'error')
            return redirect(url_for('pix.pagar'))

        if dest_chave_obj.id_cliente == current_user.id_cliente:
             flash('Não é possível transferir para si mesmo.', 'error')
             return redirect(url_for('pix.pagar'))

        # Process Transfer
        conta_origem = Conta.query.filter_by(id_cliente=current_user.id_cliente).first()
        conta_dest = Conta.query.filter_by(id_cliente=dest_chave_obj.id_cliente).first()
        destinatario = Cliente.query.get(dest_chave_obj.id_cliente)

        if conta_origem.saldo < valor:
             flash('Saldo insuficiente.', 'error')
             return redirect(url_for('pix.pagar'))

        try:
            conta_origem.saldo -= valor
            conta_dest.saldo += valor

            tx_out = Transacao(
                numero_conta=conta_origem.numero_conta,
                tipo_transacao='Pix Enviado',
                valor=-valor,
                descricao=f"Para {destinatario.nome} (Chave: {chave_dest})",
                categoria='Transferência'
            )
            tx_in = Transacao(
                numero_conta=conta_dest.numero_conta,
                tipo_transacao='Pix Recebido',
                valor=valor,
                descricao=f"De {current_user.nome} (Via Pix)",
                categoria='Transferência'
            )

            db.session.add(tx_out)
            db.session.add(tx_in)
            db.session.commit()

            flash('Pix realizado com sucesso!', 'success')
            return redirect(url_for('pix.dashboard'))
        except Exception as e:
            db.session.rollback()
            flash(f'Erro no processamento: {str(e)}', 'error')
            return redirect(url_for('pix.pagar'))

    return render_template('pix/pagar.html')
