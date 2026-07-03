from flask import Blueprint, render_template, request, redirect, url_for, flash, jsonify
from flask_login import login_required, current_user
from extensions import db
from models import Emprestimo, Conta
from decimal import Decimal
from datetime import date

loans_bp = Blueprint('loans', __name__)

@loans_bp.route('/emprestimo', methods=['GET', 'POST'])
@login_required
def emprestimo():
    if request.method == 'POST':
        try:
            valor_emprestimo = Decimal(request.form['valor_emprestimo'])
            prazo = int(request.form['prazo'])
        except ValueError:
             flash('Valores inválidos.', 'error')
             return redirect(url_for('loans.emprestimo'))

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
            return redirect(url_for('loans.confirmacao'))
        else:
            return jsonify({'message': 'Conta não encontrada'}), 404

    conta = Conta.query.filter_by(id_cliente=current_user.id_cliente).first()
    saldo = conta.saldo if conta else 0.00
    return render_template('emprestimo.html', saldo=saldo)

@loans_bp.route('/emprestimo/confirmacao')
@login_required
def confirmacao():
    return render_template('confirmacao.html', mensagem="Seu pedido de empréstimo foi enviado com sucesso!")
