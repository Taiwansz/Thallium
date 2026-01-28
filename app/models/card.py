from app.database import get_db

class CardModel:
    @staticmethod
    def create(numero, validade, cvv, id_cliente):
        db = get_db()
        cursor = db.cursor()
        query = '''
        INSERT INTO cartoes (numero, validade, cvv, id_cliente)
        VALUES (?, ?, ?, ?)
        '''
        cursor.execute(query, (numero, validade, cvv, id_cliente))
        db.commit()

    @staticmethod
    def get_by_client_id(id_cliente):
        db = get_db()
        cursor = db.cursor()
        cursor.execute("SELECT * FROM cartoes WHERE id_cliente = ?", (id_cliente,))
        return cursor.fetchall()
