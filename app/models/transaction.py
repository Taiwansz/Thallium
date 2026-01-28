from app.database import get_db

class TransactionModel:
    @staticmethod
    def log_transaction_table(numero_conta, tipo_transacao, valor, descricao=None):
        db = get_db()
        cursor = db.cursor()
        cursor.execute(
            'INSERT INTO Transacoes (numero_conta, tipo_transacao, valor, descricao) VALUES (?, ?, ?, ?)',
            (numero_conta, tipo_transacao, valor, descricao))
        db.commit()

    @staticmethod
    def log_history_table(numero_conta, tipo_transacao, valor, descricao=None):
        db = get_db()
        cursor = db.cursor()
        cursor.execute(
            'INSERT INTO Historico_Transacoes (numero_conta, tipo_transacao, valor, descricao) VALUES (?, ?, ?, ?)',
            (numero_conta, tipo_transacao, valor, descricao))
        db.commit()

    @staticmethod
    def get_all_by_account(numero_conta):
        db = get_db()
        cursor = db.cursor()
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
            UNION
            SELECT tipo_transacao, valor, data_transacao, descricao FROM Historico_Transacoes WHERE numero_conta = ?
            ) AS todas_transacoes
            ORDER BY data_transacao DESC
        '''
        cursor.execute(query, (numero_conta, numero_conta))
        return cursor.fetchall()
