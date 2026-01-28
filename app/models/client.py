from app.database import get_db

class ClientModel:
    @staticmethod
    def create(nome, cpf, email, senha_hash):
        db = get_db()
        cursor = db.cursor()
        query = '''
        INSERT INTO Clientes (nome, cpf, email, senha)
        VALUES (?, ?, ?, ?)
        '''
        cursor.execute(query, (nome, cpf, email, senha_hash))
        db.commit()
        return cursor.lastrowid

    @staticmethod
    def get_by_email(email):
        db = get_db()
        cursor = db.cursor()
        query = 'SELECT * FROM Clientes WHERE email = ?'
        cursor.execute(query, (email,))
        return cursor.fetchone()

    @staticmethod
    def get_by_id(id_cliente):
        db = get_db()
        cursor = db.cursor()
        query = 'SELECT * FROM Clientes WHERE id_cliente = ?'
        cursor.execute(query, (id_cliente,))
        return cursor.fetchone()
