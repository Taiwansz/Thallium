from flask import Blueprint, render_template, request, redirect, url_for, flash
from flask_login import login_required, current_user
from extensions import db
from models import Investimento, Conta, Transacao
from decimal import Decimal
from datetime import datetime

investments_bp = Blueprint('investments', __name__)

@investments_bp.route('/investimentos')
@login_required
def investimentos():
    meus_investimentos = Investimento.query.filter_by(id_cliente=current_user.id_cliente, resgatado=False).all()

    total_investido = Decimal(0)
    total_rendimento = Decimal(0)
    lista_com_rendimento = []

    for inv in meus_investimentos:
        dias_corridos = (datetime.utcnow() - inv.data_aplicacao).days
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

@investments_bp.route('/investir', methods=['POST'])
@login_required
def investir():
    try:
        valor = Decimal(request.form.get('valor'))
        tipo = request.form.get('tipo')
    except:
        flash('Dados inválidos.', 'error')
        return redirect(url_for('investments.investimentos'))

    if valor < 100:
         flash('Valor mínimo de R$ 100,00.', 'error')
         return redirect(url_for('investments.investimentos'))

    conta = Conta.query.filter_by(id_cliente=current_user.id_cliente).first()
    if conta.saldo < valor:
         flash('Saldo insuficiente.', 'error')
         return redirect(url_for('investments.investimentos'))

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

    return redirect(url_for('investments.investimentos'))

@investments_bp.route('/resgatar/<int:id_inv>', methods=['POST'])
@login_required
def resgatar(id_inv):
    inv = Investimento.query.filter_by(id=id_inv, id_cliente=current_user.id_cliente).first()
    if not inv or inv.resgatado:
         flash('Investimento não encontrado.', 'error')
         return redirect(url_for('investments.investimentos'))

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

    return redirect(url_for('investments.investimentos'))
