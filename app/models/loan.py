from app.database import get_db

class LoanModel:
    @staticmethod
    def create(numero_conta, valor_emprestimo, juros, prazo, data_emprestimo, data_vencimento):
        db = get_db()
        cursor = db.cursor()
        cursor.execute("""
            INSERT INTO Emprestimos (numero_conta, valor_emprestimo, juros, prazo, data_emprestimo, data_vencimento, status)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        """, (numero_conta, valor_emprestimo, juros, prazo, data_emprestimo, data_vencimento, 'pendente'))
        db.commit()
