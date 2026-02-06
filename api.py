from flask import Blueprint, jsonify, request
from models import Cliente, Conta, Transacao
from extensions import db
from decimal import Decimal
from werkzeug.security import check_password_hash

api_bp = Blueprint('api', __name__, url_prefix='/api/v1')

@api_bp.route('/balance/<int:user_id>', methods=['GET'])
def get_balance(user_id):
    conta = Conta.query.filter_by(id_cliente=user_id).first()
    if not conta:
        return jsonify({'error': 'Account not found'}), 404
    return jsonify({'balance': float(conta.saldo)})

@api_bp.route('/transfer', methods=['POST'])
def transfer():
    """
    Realiza uma transferência entre contas via API
    ---
    tags:
      - API V1
    parameters:
      - in: body
        name: body
        required: true
        schema:
          type: object
          properties:
            sender_id:
              type: integer
            password:
              type: string
            recipient_email:
              type: string
            amount:
              type: number
    responses:
      200:
        description: Transferência realizada com sucesso
      401:
        description: Credenciais inválidas
    """
    data = request.json
    sender_id = data.get('sender_id')
    recipient_email = data.get('recipient_email')
    amount = Decimal(data.get('amount'))
    password = data.get('password')

    sender = Cliente.query.get(sender_id)
    if not sender or not check_password_hash(sender.senha, password):
        return jsonify({'error': 'Invalid credentials'}), 401

    sender_account = Conta.query.filter_by(id_cliente=sender_id).first()
    recipient_client = Cliente.query.filter_by(email=recipient_email).first()

    if not recipient_client:
         return jsonify({'error': 'Recipient not found'}), 404

    recipient_account = Conta.query.filter_by(id_cliente=recipient_client.id_cliente).first()

    if sender_account.saldo < amount:
         return jsonify({'error': 'Insufficient funds'}), 400

    try:
        sender_account.saldo -= amount
        recipient_account.saldo += amount

        tx = Transacao(
            numero_conta=sender_account.numero_conta,
            tipo_transacao='API Transfer',
            valor=-amount,
            descricao='Transfer via API'
        )
        db.session.add(tx)
        db.session.commit()
        return jsonify({'message': 'Transfer successful', 'new_balance': float(sender_account.saldo)}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500
