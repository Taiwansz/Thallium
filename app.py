from flask import Flask, render_template, redirect, url_for
from decimal import Decimal
from extensions import db, migrate, limiter, ma, swagger
from config import Config
from models import Cliente, Conta, Investimento, Cartao
from flask_login import LoginManager, current_user, login_required
from flask_wtf.csrf import CSRFProtect
from jobs import yield_daily_command

app = Flask(__name__)
app.cli.add_command(yield_daily_command)
app.config.from_object(Config)

csrf = CSRFProtect(app)
db.init_app(app)
migrate.init_app(app, db)
limiter.init_app(app)
ma.init_app(app)
swagger.init_app(app)

login_manager = LoginManager()
login_manager.init_app(app)
login_manager.login_view = 'auth.login'

@login_manager.user_loader
def load_user(user_id):
    return db.session.get(Cliente, int(user_id))

# Template Filters
@app.template_filter('currency')
def currency_filter(value):
    if value is None: return "R$ 0,00"
    return "R$ {:,.2f}".format(value).replace('.', 'X').replace(',', '.').replace('X', ',')

@app.template_filter('datetime')
def datetime_filter(value):
    if value is None: return ""
    return value.strftime('%d/%m/%Y %H:%M')

# Error Handlers
@app.errorhandler(404)
def page_not_found(e):
    return render_template('404.html'), 404

@app.errorhandler(500)
def internal_server_error(e):
    return render_template('500.html'), 500

# Core Root Views
@app.route('/')
def home():
    if current_user.is_authenticated:
        return redirect(url_for('index'))
    return redirect(url_for('auth.login'))

@app.route('/index')
@login_required
def index():
    conta = Conta.query.filter_by(id_cliente=current_user.id_cliente).first()
    saldo = conta.saldo if conta else 0.00

    investimentos_ativos = Investimento.query.filter_by(id_cliente=current_user.id_cliente, resgatado=False).all()
    total_investido = sum([i.valor_inicial for i in investimentos_ativos])

    patrimonio_total = Decimal(saldo) + total_investido

    cartoes = Cartao.query.filter_by(id_cliente=current_user.id_cliente).all()
    fatura_atual = sum([c.limite_usado for c in cartoes])

    return render_template('index.html',
                           saldo=saldo,
                           user=current_user,
                           total_investido=total_investido,
                           patrimonio_total=patrimonio_total,
                           fatura_atual=fatura_atual)

# Register Blueprints
from routes_auth import auth_bp
from routes_transactions import transactions_bp
from routes_cards import cards_bp
from routes_investments import investments_bp
from routes_loans import loans_bp
from routes_pix import pix_bp
from api import api_bp

app.register_blueprint(auth_bp)
app.register_blueprint(transactions_bp)
app.register_blueprint(cards_bp)
app.register_blueprint(investments_bp)
app.register_blueprint(loans_bp)
app.register_blueprint(pix_bp)
app.register_blueprint(api_bp)

# Auto DB Init
with app.app_context():
    db.create_all()

if __name__ == '__main__':
    app.run(debug=True)
