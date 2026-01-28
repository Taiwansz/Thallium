from app.database import get_db

class AccountModel:
    @staticmethod
    def create(id_cliente, saldo, data_abertura, tipo_conta):
        db = get_db()
        cursor = db.cursor()
        query = '''
        INSERT INTO Contas (id_cliente, saldo, data_abertura, tipo_conta)
        VALUES (?, ?, ?, ?)
        '''
        cursor.execute(query, (id_cliente, saldo, data_abertura, tipo_conta))
        db.commit()
        return cursor.lastrowid

    @staticmethod
    def get_by_client_id(id_cliente):
        db = get_db()
        cursor = db.cursor()
        query = 'SELECT * FROM Contas WHERE id_cliente = ?'
        cursor.execute(query, (id_cliente,))
        return cursor.fetchone()

    @staticmethod
    def get_by_number(numero_conta):
        db = get_db()
        cursor = db.cursor()
        query = 'SELECT * FROM Contas WHERE numero_conta = ?'
        cursor.execute(query, (numero_conta,))
        return cursor.fetchone()

    @staticmethod
    def credit(numero_conta, amount):
        db = get_db()
        cursor = db.cursor()
        cursor.execute('UPDATE Contas SET saldo = saldo + ? WHERE numero_conta = ?', (amount, numero_conta))
        db.commit()

    @staticmethod
    def debit(numero_conta, amount):
        db = get_db()
        cursor = db.cursor()
        cursor.execute('UPDATE Contas SET saldo = saldo - ? WHERE numero_conta = ?', (amount, numero_conta))
        db.commit()
