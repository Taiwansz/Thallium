from flask import Blueprint, render_template, request, redirect, url_for, flash
from flask_login import login_required, current_user
from extensions import db
from models import Cartao, Conta, Transacao
from decimal import Decimal

cards_bp = Blueprint('cards', __name__)

@cards_bp.route('/cartoes')
@login_required
def cartoes():
    cartoes_list = Cartao.query.filter_by(id_cliente=current_user.id_cliente).all()
    return render_template('cartoes.html', cartoes=cartoes_list)

@cards_bp.route('/cartoes/bloquear/<int:id_cartao>', methods=['POST'])
@login_required
def bloquear_cartao(id_cartao):
    cartao = Cartao.query.filter_by(id=id_cartao, id_cliente=current_user.id_cliente).first()
    if cartao:
        cartao.bloqueado = True
        db.session.commit()
        flash('Cartão bloqueado com sucesso.', 'success')
    else:
        flash('Cartão não encontrado.', 'error')
    return redirect(url_for('cards.cartoes'))

@cards_bp.route('/cartoes/desbloquear/<int:id_cartao>', methods=['POST'])
@login_required
def desbloquear_cartao(id_cartao):
    cartao = Cartao.query.filter_by(id=id_cartao, id_cliente=current_user.id_cliente).first()
    if cartao:
        cartao.bloqueado = False
        db.session.commit()
        flash('Cartão desbloqueado com sucesso.', 'success')
    else:
        flash('Cartão não encontrado.', 'error')
    return redirect(url_for('cards.cartoes'))

@cards_bp.route('/cartoes/pagar_fatura/<int:id_cartao>', methods=['POST'])
@login_required
def pagar_fatura(id_cartao):
    cartao = Cartao.query.filter_by(id=id_cartao, id_cliente=current_user.id_cliente).first()
    if not cartao:
        flash('Cartão não encontrado.', 'error')
        return redirect(url_for('cards.cartoes'))

    try:
        valor = Decimal(request.form.get('valor'))
    except:
        flash('Valor inválido.', 'error')
        return redirect(url_for('cards.cartoes'))

    if valor <= 0 or valor > cartao.limite_usado:
        flash('Valor inválido para pagamento.', 'error')
        return redirect(url_for('cards.cartoes'))

    conta = Conta.query.filter_by(id_cliente=current_user.id_cliente).first()
    if conta.saldo < valor:
        flash('Saldo insuficiente na conta corrente.', 'error')
        return redirect(url_for('cards.cartoes'))

    try:
        conta.saldo -= valor
        cartao.limite_usado -= valor

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

    return redirect(url_for('cards.cartoes'))
