from flask import Flask, render_template, request, redirect, url_for, session, flash, jsonify
# import mysql.connector
import sqlite3
from werkzeug.security import generate_password_hash, check_password_hash
from datetime import date
import random


app = Flask(__name__)
app.secret_key = 'sua_chave_secreta'

# db_config = {
#     'user': 'tester6',
#     'password': '1233',
#     'host': 'localhost',
#     'database': 'thalium'
# }


def get_db_connection():
    try:
        # connection = mysql.connector.connect(**db_config)
        connection = sqlite3.connect('thalium.db')
        connection.row_factory = sqlite3.Row
        return connection
    except sqlite3.Error as err:
        print(f"Error: {err}")
        return None


@app.route('/')
def home():
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

    # Hash da senha
    senha_hash = generate_password_hash(senha)

    connection = get_db_connection()
    if connection is None:
        return jsonify({'message': 'Erro na conexão com o banco de dados.'}), 500

    cursor = connection.cursor()
    try:
        # Inserir o cliente
        query = '''
        INSERT INTO Clientes (nome, cpf, email, senha)
        VALUES (?, ?, ?, ?)
        '''
        cursor.execute(query, (nome, cpf, email, senha_hash))
        connection.commit()

        id_cliente = cursor.lastrowid
        saldo_inicial = 0.00
        tipo_conta = 'Corrente'
        data_abertura = str(date.today())

        query_conta = '''
        INSERT INTO Contas (id_cliente, saldo, data_abertura, tipo_conta)
        VALUES (?, ?, ?, ?)
        '''
        cursor.execute(query_conta, (id_cliente, saldo_inicial, data_abertura, tipo_conta))
        connection.commit()

        def gerar_numero_cartao():
            return ''.join([str(random.randint(0, 9)) for _ in range(16)])
        numero_cartao = gerar_numero_cartao()
        validade = f"{random.randint(1, 12):02d}/{random.randint(25, 30)}"
        cvv = f"{random.randint(100, 999)}"

        query_cartao = '''
        INSERT INTO cartoes (numero, validade, cvv, id_cliente)
        VALUES (?, ?, ?, ?)
        '''
        cursor.execute(query_cartao, (numero_cartao, validade, cvv, id_cliente))
        connection.commit()

        return jsonify({
            'message': 'Cliente, conta e cartão cadastrados com sucesso!',
            'id_cliente': id_cliente,
            'tipo_conta': tipo_conta,
            'data_abertura': str(data_abertura),
            'numero_cartao': numero_cartao,
            'validade': validade,
            'cvv': cvv
        })

    except sqlite3.IntegrityError:
        return jsonify({'message': 'Erro ao cadastrar: CPF ou email já existe.'}), 400
    except Exception as e:
        return jsonify({'message': f'Erro inesperado: {str(e)}'}), 500
    finally:
        cursor.close()
        connection.close()


@app.route('/index')
def index():
    if 'user_email' in session:
        user_email = session['user_email']
        connection = get_db_connection()
        cursor = connection.cursor()

        try:
            query = 'SELECT id_cliente FROM Clientes WHERE email = ?'
            cursor.execute(query, (user_email,))
            user = cursor.fetchone()

            if user:
                id_cliente = user['id_cliente']
                query = 'SELECT saldo FROM Contas WHERE id_cliente = ?'
                cursor.execute(query, (id_cliente,))
                conta = cursor.fetchone()

                if conta:
                    saldo = conta['saldo']
                else:
                    saldo = 0.00
            else:
                saldo = 0.00

            # cursor.fetchall() # Not needed in sqlite usually, but ok
        except Exception as e:
            print(f"Erro ao buscar dados: {e}")
            saldo = 0.00
        finally:
            cursor.close()
            connection.close()

        return render_template('index.html', saldo=saldo)
    else:
        return redirect(url_for('login'))


@app.route('/extrato')
def extrato():
    return render_template('extrato.html')


@app.route('/transfer', methods=['GET', 'POST'])
def transferir():
    if request.method == 'POST':
        recipient_email = request.form.get('recipient')
        amount = float(request.form.get('amount'))
        description = request.form.get('description')

        if amount <= 0:
            return jsonify({'message': 'Valor de transferência deve ser positivo.'}), 400

        connection = get_db_connection()
        cursor = connection.cursor()

        try:

            sender_email = session['user_email']
            cursor.execute(
                'SELECT numero_conta FROM Contas WHERE id_cliente = (SELECT id_cliente FROM Clientes WHERE email = ?)',
                (sender_email,))
            sender_account = cursor.fetchone()

            if not sender_account:
                return jsonify({'message': 'Conta do remetente não encontrada.'}), 404

            cursor.execute(
                'SELECT c.numero_conta FROM Contas c JOIN Clientes cl ON c.id_cliente = cl.id_cliente WHERE cl.email = ?',
                (recipient_email,))
            recipient_account = cursor.fetchone()

            if not recipient_account:
                return jsonify({'message': 'Destinatário não encontrado.'}), 404

            cursor.execute('SELECT saldo FROM Contas WHERE numero_conta = ?', (sender_account['numero_conta'],))
            sender_balance = cursor.fetchone()

            if sender_balance['saldo'] < amount:
                return jsonify({'message': 'Saldo insuficiente.'}), 400

            cursor.execute('UPDATE Contas SET saldo = saldo - ? WHERE numero_conta = ?',
                           (amount, sender_account['numero_conta']))
            cursor.execute('UPDATE Contas SET saldo = saldo + ? WHERE numero_conta = ?',
                           (amount, recipient_account['numero_conta']))

            cursor.execute(
                'INSERT INTO Transacoes (numero_conta, tipo_transacao, valor, descricao) VALUES (?, ?, ?, ?)',
                (sender_account['numero_conta'], 'Transferência', amount, description))

            cursor.execute(
                'INSERT INTO Historico_Transacoes (numero_conta, tipo_transacao, valor, descricao) VALUES (?, ?, ?, ?)',
                (sender_account['numero_conta'], 'Transferência', amount, description))

            connection.commit()

            cursor.execute('SELECT saldo FROM Contas WHERE numero_conta = ?', (sender_account['numero_conta'],))
            novo_saldo = cursor.fetchone()['saldo']
            print("Novo saldo do remetente:", novo_saldo)
            return redirect(url_for('index'))

        except Exception as e:
            connection.rollback()
            return jsonify({'message': 'Erro: ' + str(e)}), 500

        finally:
            cursor.close()
            connection.close()
    else:
        return render_template('transfer.html')


@app.route('/historico')
def historico():
    user_email = session.get('user_email')
    if not user_email:
        return jsonify({'message': 'Usuário não autenticado.'}), 401

    connection = get_db_connection()
    cursor = connection.cursor()

    try:
        query = '''
        SELECT numero_conta FROM Contas 
        WHERE id_cliente = (SELECT id_cliente FROM Clientes WHERE email = ?)
        '''
        cursor.execute(query, (user_email,))
        conta = cursor.fetchone()

        if not conta:
            return jsonify({'message': 'Conta não encontrada.'}), 404

        numero_conta = conta['numero_conta']

        query = '''
        SELECT tipo_transacao, 
            CASE 
                WHEN tipo_transacao IN ('Saque', 'Transferência') THEN -valor 
                ELSE valor 
                END AS valor,
                data_transacao, 
                descricao
        FROM (
            SELECT tipo_transacao, valor, data_transacao, descricao FROM Transacoes WHERE numero_conta = ?
            UNION  -- Mudança de UNION ALL para UNION
            SELECT tipo_transacao, valor, data_transacao, descricao FROM Historico_Transacoes WHERE numero_conta = ?
            ) AS todas_transacoes
            ORDER BY data_transacao DESC

        '''
        cursor.execute(query, (numero_conta, numero_conta))
        transacoes = cursor.fetchall()

        return render_template('historico.html', transacoes=transacoes)

    finally:
        cursor.close()
        connection.close()


@app.route('/cadastro')
def cadastro():
    return render_template('register.html')


@app.route('/boleto')
def pagar():
    return render_template('boleto.html')


@app.route('/pagamento_boleto', methods=['POST'])
def pagamento_boleto():
    if request.method == 'POST':
        valor = request.form['valor']
        try:
            valor = float(valor)
            if valor <= 0:
                return jsonify({'message': 'O valor deve ser maior que zero.'}), 400
        except ValueError:
            return jsonify({'message': 'Valor inválido.'}), 400

        user_email = session.get('user_email')
        connection = get_db_connection()
        cursor = connection.cursor()

        try:
            cursor.execute('SELECT id_cliente FROM Clientes WHERE email = ?', (user_email,))
            user = cursor.fetchone()

            if user:
                cursor.execute('SELECT numero_conta, saldo FROM Contas WHERE id_cliente = ?', (user['id_cliente'],))
                conta = cursor.fetchone()

                if conta:
                    numero_conta = conta['numero_conta']
                    saldo_atual = conta['saldo']

                    # Verifica se o saldo é suficiente para o pagamento
                    if saldo_atual >= valor:
                        # Atualiza o saldo da conta
                        cursor.execute('UPDATE Contas SET saldo = saldo - ? WHERE numero_conta = ?',
                                       (valor, numero_conta))
                        connection.commit()

                        # Agora, registra a transação no histórico
                        cursor.execute(
                            'INSERT INTO Historico_Transacoes (numero_conta, tipo_transacao, valor) VALUES (?, ?, ?)',
                            (numero_conta, 'Pagamento Boleto', -valor))  # Registrando como valor negativo

                        connection.commit()

                        return redirect(url_for('index'))
                    else:
                        return jsonify({'message': 'Saldo insuficiente para o pagamento.'}), 400
                else:
                    return jsonify({'message': 'Conta não encontrada.'}), 404
            else:
                return jsonify({'message': 'Usuário não encontrado.'}), 404

        finally:
            cursor.close()
            connection.close()

    return render_template('pagamento_boleto.html')


@app.route('/sucesso')
def sucesso():
    return "Boleto pago com sucesso!"


@app.route('/login', methods=['GET', 'POST'])
def login():
    if request.method == 'POST':
        email = request.form['email']
        password = request.form['password']

        connection = get_db_connection()
        if connection is None:
            flash('Erro na conexão com o banco de dados.', 'error')
            return render_template('login.html')

        cursor = connection.cursor()
        try:
            query = 'SELECT id_cliente, nome, senha FROM Clientes WHERE email = ?'
            cursor.execute(query, (email,))
            user = cursor.fetchone()

            # cursor.fetchall()  # Garantir que qualquer resultado pendente seja consumido

            if user is None:
                flash('Usuário não encontrado.', 'error')
                return render_template('login.html')

            if not check_password_hash(user['senha'], password):
                flash('Senha incorreta.', 'error')
                return render_template('login.html')

            session['user_email'] = email
            session['username'] = user['nome']
            session['id_cliente'] = user['id_cliente']
            return redirect(url_for('index'))
        finally:
            cursor.close()
            connection.close()
    else:
        return render_template('login.html')


@app.route('/saldo/<int:numero_conta>', methods=['GET'])
def saldo(numero_conta):
    connection = get_db_connection()
    if connection is None:
        return jsonify({'message': 'Erro na conexão com o banco de dados.'}), 500

    cursor = connection.cursor()
    try:
        query = 'SELECT saldo FROM Contas WHERE numero_conta = ?'
        cursor.execute(query, (numero_conta,))
        result = cursor.fetchone()

        # Convert Row to dict for jsonify if result exists
        if result:
            result = dict(result)

    finally:
        cursor.close()
        connection.close()

    return jsonify(result if result else {'message': 'Conta não encontrada.'})


@app.route('/deposito', methods=['GET', 'POST'])
def deposito():
    if request.method == 'POST':
        valor = request.form['valor']
        try:
            valor = float(valor)
            if valor <= 0:
                return jsonify({'message': 'O valor deve ser maior que zero.'}), 400
        except ValueError:
            return jsonify({'message': 'Valor inválido.'}), 400

        user_email = session.get('user_email')
        connection = get_db_connection()
        cursor = connection.cursor()

        try:
            cursor.execute('SELECT id_cliente FROM Clientes WHERE email = ?', (user_email,))
            user = cursor.fetchone()

            if user:
                cursor.execute('SELECT numero_conta FROM Contas WHERE id_cliente = ?', (user['id_cliente'],))
                conta = cursor.fetchone()

                if conta:
                    numero_conta = conta['numero_conta']
                    cursor.execute('UPDATE Contas SET saldo = saldo + ? WHERE numero_conta = ?',
                                   (valor, numero_conta))
                    connection.commit()

                    cursor.execute(
                        'INSERT INTO Transacoes (numero_conta, tipo_transacao, valor) VALUES (?, ?, ?)',
                        (numero_conta, 'Depósito', valor))

                    cursor.execute(
                        'INSERT INTO Historico_Transacoes (numero_conta, tipo_transacao, valor) VALUES (?, ?, ?)',
                        (numero_conta, 'Depósito', valor))

                    connection.commit()
                    return redirect(url_for('index'))
                else:
                    return jsonify({'message': 'Conta não encontrada.'}), 404
            else:
                return jsonify({'message': 'Usuário não encontrado.'}), 404

        finally:
            cursor.close()
            connection.close()

    return render_template('deposito.html')


@app.route('/cartoes')
def cartoes():
    if 'id_cliente' not in session:
        print("Usuário não logado, redirecionando para login...")
        return redirect(url_for('login')) # Fixed redirect to 'login' instead of 'login_post' which doesn't exist

    id_cliente = session['id_cliente']
    print(f"Usuário logado, id_cliente: {id_cliente}")
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM cartoes WHERE id_cliente = ?", (id_cliente,))
    cartoes = cursor.fetchall()

    if cartoes:
        print("Cartões encontrados:", cartoes)
    else:
        print("Nenhum cartão encontrado para esse usuário.")

    return render_template('cartoes.html', cartoes=cartoes)


@app.route('/erro')
def pagina_erro():
    return "Nenhum cartão encontrado para o cliente."


@app.route('/logout')
def logout():
    session.clear()
    return redirect(url_for('login'))


@app.route('/saque', methods=['GET', 'POST'])
def saque():
    if request.method == 'POST':
        valor = request.form['valor']
        try:
            valor = float(valor)
            if valor <= 0:
                return jsonify({'message': 'O valor deve ser maior que zero.'}), 400
        except ValueError:
            return jsonify({'message': 'Valor inválido.'}), 400

        user_email = session.get('user_email')
        connection = get_db_connection()
        cursor = connection.cursor()

        try:
            cursor.execute('SELECT id_cliente FROM Clientes WHERE email = ?', (user_email,))
            user = cursor.fetchone()

            if user:
                cursor.execute('SELECT numero_conta, saldo FROM Contas WHERE id_cliente = ?', (user['id_cliente'],))
                conta = cursor.fetchone()

                if conta:
                    numero_conta = conta['numero_conta']
                    saldo_atual = conta['saldo']

                    if saldo_atual >= valor:
                        cursor.execute('UPDATE Contas SET saldo = saldo - ? WHERE numero_conta = ?',
                                       (valor, numero_conta))
                        connection.commit()

                        cursor.execute(
                            'INSERT INTO Transacoes (numero_conta, tipo_transacao, valor) VALUES (?, ?, ?)',
                            (numero_conta, 'Saque', valor))

                        cursor.execute(
                            'INSERT INTO Historico_Transacoes (numero_conta, tipo_transacao, valor) VALUES (?, ?, ?)',
                            (numero_conta, 'Saque', valor))

                        connection.commit()
                        return redirect(url_for('index'))
                    else:
                        return jsonify({'message': 'Saldo insuficiente.'}), 400
                else:
                    return jsonify({'message': 'Conta não encontrada.'}), 404
            else:
                return jsonify({'message': 'Usuário não encontrado.'}), 404

        finally:
            cursor.close()
            connection.close()

    return render_template('saque.html')


@app.route('/emprestimo', methods=['GET', 'POST'])
def emprestimo():
    if request.method == 'POST':
        valor_emprestimo = float(request.form['valor_emprestimo'])
        prazo = int(request.form['prazo'])
        # numero_conta might not be in session? Checking code...
        # It's not set in login.
        # I need to fetch it or assume it's set somewhere else?
        # In `index` it fetches user and conta, but doesn't set numero_conta in session.
        # But here it uses session.get('numero_conta').
        # If I look at the original code: `numero_conta = session.get('numero_conta')`
        # This seems like a bug in the original code unless I missed where it is set.
        # However, for now I will keep it as is, or fix it if it crashes.
        # Let's fix it by fetching it if missing.

        user_email = session.get('user_email')
        conn = get_db_connection()
        cursor = conn.cursor()

        if not session.get('numero_conta'):
             cursor.execute('SELECT numero_conta FROM Contas WHERE id_cliente = (SELECT id_cliente FROM Clientes WHERE email = ?)', (user_email,))
             res = cursor.fetchone()
             if res:
                 numero_conta = res['numero_conta']
             else:
                 return "Conta não encontrada", 400
        else:
             numero_conta = session.get('numero_conta')

        juros = 1.05
        data_emprestimo = str(date.today())
        data_vencimento = str(date.today().replace(year=date.today().year + 1))

        cursor.execute("""
            INSERT INTO Emprestimos (numero_conta, valor_emprestimo, juros, prazo, data_emprestimo, data_vencimento, status)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        """, (numero_conta, valor_emprestimo, juros, prazo, data_emprestimo, data_vencimento, 'pendente'))
        conn.commit()
        conn.close()

        return redirect(url_for('confirmacao'))

    return render_template('emprestimo.html')


@app.route('/emprestimo/confirmacao')
def confirmacao():
    return render_template('confirmacao.html', mensagem="Seu pedido de empréstimo foi enviado com sucesso!")


if __name__ == '__main__':
    app.run(debug=False, port=5000)
