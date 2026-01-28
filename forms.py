from flask_wtf import FlaskForm
from wtforms import StringField, PasswordField, SubmitField, FloatField, IntegerField
from wtforms.validators import DataRequired, Email, Length, EqualTo, ValidationError, NumberRange
from models import Cliente

class LoginForm(FlaskForm):
    email = StringField('Email', validators=[DataRequired(), Email()])
    password = PasswordField('Senha', validators=[DataRequired()])
    submit = SubmitField('Login')

class RegisterForm(FlaskForm):
    nome = StringField('Nome', validators=[DataRequired(), Length(min=2, max=100)])
    cpf = StringField('CPF', validators=[DataRequired(), Length(min=11, max=11)])
    email = StringField('Email', validators=[DataRequired(), Email()])
    password = PasswordField('Senha', validators=[DataRequired(), Length(min=6)])
    confirm_password = PasswordField('Confirmar Senha', validators=[DataRequired(), EqualTo('password')])
    submit = SubmitField('Cadastrar')

    def validate_email(self, email):
        cliente = Cliente.query.filter_by(email=email.data).first()
        if cliente:
            raise ValidationError('Este email já está cadastrado.')

    def validate_cpf(self, cpf):
        cliente = Cliente.query.filter_by(cpf=cpf.data).first()
        if cliente:
            raise ValidationError('Este CPF já está cadastrado.')

class TransferForm(FlaskForm):
    recipient_email = StringField('Email do Destinatário', validators=[DataRequired(), Email()])
    amount = FloatField('Valor', validators=[DataRequired(), NumberRange(min=0.01, message="O valor deve ser maior que zero.")])
    description = StringField('Descrição')
    submit = SubmitField('Transferir')

class DepositForm(FlaskForm):
    amount = FloatField('Valor', validators=[DataRequired(), NumberRange(min=0.01, message="O valor deve ser maior que zero.")])
    submit = SubmitField('Depositar')

class WithdrawForm(FlaskForm):
    amount = FloatField('Valor', validators=[DataRequired(), NumberRange(min=0.01, message="O valor deve ser maior que zero.")])
    submit = SubmitField('Sacar')

class BoletoForm(FlaskForm):
    amount = FloatField('Valor do Boleto', validators=[DataRequired(), NumberRange(min=0.01, message="O valor deve ser maior que zero.")])
    submit = SubmitField('Pagar')

class LoanForm(FlaskForm):
    amount = FloatField('Valor do Empréstimo', validators=[DataRequired(), NumberRange(min=0.01, message="O valor deve ser maior que zero.")])
    prazo = IntegerField('Prazo (meses)', validators=[DataRequired(), NumberRange(min=1, message="O prazo deve ser de pelo menos 1 mês.")])
    submit = SubmitField('Solicitar Empréstimo')
