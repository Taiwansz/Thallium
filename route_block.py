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
