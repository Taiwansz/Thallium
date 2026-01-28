from flask import Blueprint, render_template, request, redirect, url_for, session, jsonify, flash
from app.services.banking_service import BankingService
from app.services.loan_service import LoanService

bp = Blueprint('main', __name__)

@bp.route('/index')
def index():
    if 'user_email' in session:
        account = BankingService.get_account_by_email(session['user_email'])
        saldo = account['saldo'] if account else 0.00
        return render_template('index.html', saldo=saldo)
    else:
        return redirect(url_for('auth.login'))

@bp.route('/extrato')
def extrato():
    return render_template('extrato.html')

@bp.route('/transfer', methods=['GET', 'POST'])
def transferir():
    if request.method == 'POST':
        recipient_email = request.form.get('recipient')
        try:
            amount = float(request.form.get('amount'))
        except (ValueError, TypeError):
             return jsonify({'message': 'Valor inválido.'}), 400

        description = request.form.get('description')
        sender_email = session.get('user_email')

        if not sender_email:
             return jsonify({'message': 'Usuário não autenticado.'}), 401

        try:
            BankingService.transfer(sender_email, recipient_email, amount, description)
            return redirect(url_for('main.index'))
        except ValueError as e:
            return jsonify({'message': str(e)}), 400
        except Exception as e:
            return jsonify({'message': 'Erro: ' + str(e)}), 500
    else:
        return render_template('transfer.html')

@bp.route('/historico')
def historico():
    user_email = session.get('user_email')
    if not user_email:
        return jsonify({'message': 'Usuário não autenticado.'}), 401

    try:
        transacoes = BankingService.get_history(user_email)
        return render_template('historico.html', transacoes=transacoes)
    except ValueError as e:
        return jsonify({'message': str(e)}), 404

@bp.route('/boleto')
def pagar():
    return render_template('boleto.html')

@bp.route('/pagamento_boleto', methods=['POST'])
def pagamento_boleto():
    if request.method == 'POST':
        try:
            valor = float(request.form['valor'])
        except (ValueError, KeyError):
            return jsonify({'message': 'Valor inválido.'}), 400

        user_email = session.get('user_email')

        try:
            BankingService.pay_boleto(user_email, valor)
            return redirect(url_for('main.index'))
        except ValueError as e:
             return jsonify({'message': str(e)}), 400
        except Exception as e:
             return jsonify({'message': 'Erro: ' + str(e)}), 500

    return render_template('pagamento_boleto.html')

@bp.route('/sucesso')
def sucesso():
    return "Boleto pago com sucesso!"

@bp.route('/saldo/<int:numero_conta>', methods=['GET'])
def saldo(numero_conta):
    account = BankingService.get_balance(numero_conta)
    if account:
        return jsonify({'saldo': account['saldo']})
    else:
        return jsonify({'message': 'Conta não encontrada.'})

@bp.route('/deposito', methods=['GET', 'POST'])
def deposito():
    if request.method == 'POST':
        try:
            valor = float(request.form['valor'])
        except (ValueError, KeyError):
            return jsonify({'message': 'Valor inválido.'}), 400

        user_email = session.get('user_email')
        try:
            BankingService.deposit(user_email, valor)
            return redirect(url_for('main.index'))
        except ValueError as e:
             return jsonify({'message': str(e)}), 400
        except Exception as e:
             return jsonify({'message': 'Erro: ' + str(e)}), 500

    return render_template('deposito.html')

@bp.route('/cartoes')
def cartoes():
    if 'id_cliente' not in session:
        return redirect(url_for('auth.login'))

    id_cliente = session['id_cliente']
    cartoes_list = BankingService.get_cards(id_cliente)
    return render_template('cartoes.html', cartoes=cartoes_list)

@bp.route('/erro')
def pagina_erro():
    return "Nenhum cartão encontrado para o cliente."

@bp.route('/saque', methods=['GET', 'POST'])
def saque():
    if request.method == 'POST':
        try:
            valor = float(request.form['valor'])
        except (ValueError, KeyError):
             return jsonify({'message': 'Valor inválido.'}), 400

        user_email = session.get('user_email')
        try:
             BankingService.withdraw(user_email, valor)
             return redirect(url_for('main.index'))
        except ValueError as e:
             return jsonify({'message': str(e)}), 400
        except Exception as e:
             return jsonify({'message': 'Erro: ' + str(e)}), 500

    return render_template('saque.html')

@bp.route('/emprestimo', methods=['GET', 'POST'])
def emprestimo():
    if request.method == 'POST':
        try:
            valor_emprestimo = float(request.form['valor_emprestimo'])
            prazo = int(request.form['prazo'])

            user_email = session.get('user_email')
            account = BankingService.get_account_by_email(user_email)
            if account:
                numero_conta = account['numero_conta']
                LoanService.request_loan(numero_conta, valor_emprestimo, prazo)
                return redirect(url_for('main.confirmacao'))
        except (ValueError, KeyError):
             pass

    return render_template('emprestimo.html')

@bp.route('/emprestimo/confirmacao')
def confirmacao():
    return render_template('confirmacao.html', mensagem="Seu pedido de empréstimo foi enviado com sucesso!")
