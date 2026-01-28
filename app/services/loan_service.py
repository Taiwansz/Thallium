from app.models.loan import LoanModel
from datetime import date

class LoanService:
    @staticmethod
    def request_loan(numero_conta, valor, prazo):
        juros = 1.05
        data_emprestimo = date.today()
        data_vencimento = data_emprestimo.replace(year=data_emprestimo.year + 1)

        LoanModel.create(numero_conta, valor, juros, prazo, data_emprestimo, data_vencimento)
