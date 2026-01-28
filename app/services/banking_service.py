from app.models.account import AccountModel
from app.models.client import ClientModel
from app.models.transaction import TransactionModel
from app.models.card import CardModel

class BankingService:
    @staticmethod
    def get_account_by_email(email):
        user = ClientModel.get_by_email(email)
        if user:
            return AccountModel.get_by_client_id(user['id_cliente'])
        return None

    @staticmethod
    def deposit(email, amount):
        if amount <= 0:
            raise ValueError('O valor deve ser maior que zero.')

        account = BankingService.get_account_by_email(email)
        if not account:
            raise ValueError('Conta não encontrada.')

        AccountModel.credit(account['numero_conta'], amount)
        TransactionModel.log_transaction_table(account['numero_conta'], 'Depósito', amount)
        TransactionModel.log_history_table(account['numero_conta'], 'Depósito', amount)

    @staticmethod
    def withdraw(email, amount):
        if amount <= 0:
            raise ValueError('O valor deve ser maior que zero.')

        account = BankingService.get_account_by_email(email)
        if not account:
            raise ValueError('Conta não encontrada.')

        if account['saldo'] < amount:
            raise ValueError('Saldo insuficiente.')

        AccountModel.debit(account['numero_conta'], amount)
        TransactionModel.log_transaction_table(account['numero_conta'], 'Saque', amount)
        TransactionModel.log_history_table(account['numero_conta'], 'Saque', amount)

    @staticmethod
    def transfer(sender_email, recipient_email, amount, description):
        if amount <= 0:
            raise ValueError('Valor de transferência deve ser positivo.')

        sender_account = BankingService.get_account_by_email(sender_email)
        recipient_account = BankingService.get_account_by_email(recipient_email)

        if not sender_account:
            raise ValueError('Conta do remetente não encontrada.')
        if not recipient_account:
            raise ValueError('Destinatário não encontrado.')

        if sender_account['saldo'] < amount:
            raise ValueError('Saldo insuficiente.')

        AccountModel.debit(sender_account['numero_conta'], amount)
        AccountModel.credit(recipient_account['numero_conta'], amount)

        TransactionModel.log_transaction_table(sender_account['numero_conta'], 'Transferência', amount, description)
        TransactionModel.log_history_table(sender_account['numero_conta'], 'Transferência', amount, description)

    @staticmethod
    def pay_boleto(email, amount):
        if amount <= 0:
            raise ValueError('O valor deve ser maior que zero.')

        account = BankingService.get_account_by_email(email)
        if not account:
            raise ValueError('Conta não encontrada.')

        if account['saldo'] < amount:
            raise ValueError('Saldo insuficiente para o pagamento.')

        AccountModel.debit(account['numero_conta'], amount)
        TransactionModel.log_history_table(account['numero_conta'], 'Pagamento Boleto', -amount)

    @staticmethod
    def get_history(email):
        account = BankingService.get_account_by_email(email)
        if not account:
            raise ValueError('Conta não encontrada.')
        return TransactionModel.get_all_by_account(account['numero_conta'])

    @staticmethod
    def get_balance(numero_conta):
        return AccountModel.get_by_number(numero_conta)

    @staticmethod
    def get_cards(id_cliente):
        return CardModel.get_by_client_id(id_cliente)
