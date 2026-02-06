from extensions import ma
from models import Transacao
from marshmallow import fields, validate

class TransferenciaSchema(ma.Schema):
    recipient = fields.Email(required=True, error_messages={"required": "Email do destinatário é obrigatório."})
    amount = fields.Decimal(required=True, as_string=True, validate=validate.Range(min=0.01, error="O valor deve ser positivo."))
    description = fields.Str(load_default="")
    category = fields.Str(load_default="Outros")
    pin = fields.Str(required=False) # Handled separately for auth check

transferencia_schema = TransferenciaSchema()
