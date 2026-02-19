import random
import string
from datetime import datetime, timedelta
from flask import current_app, url_for, render_template_string
from flask_mail import Message
from extensions import db, mail
from models import VerificationCode

def generate_code(length=6):
    return ''.join(random.choices(string.digits, k=length))

def send_verification_email(email, code_type='register'):
    """
    Generates a code, saves it to DB, and sends an email.
    code_type: 'register' or 'reset'
    """
    code = generate_code()
    expiration = datetime.utcnow() + timedelta(minutes=15)

    # Store in DB
    ver_code = VerificationCode(
        email=email,
        code=code,
        type=code_type,
        expires_at=expiration
    )
    db.session.add(ver_code)
    db.session.commit()

    subject = "Seu código de verificação - Thalium Bank"
    if code_type == 'reset':
        subject = "Redefinição de Senha - Thalium Bank"

    body = f"""
    <h1>Thalium Private Banking</h1>
    <p>Use o código abaixo para completar sua ação:</p>
    <h2 style="color: #1a2c4e;">{code}</h2>
    <p>Este código expira em 15 minutos.</p>
    """

    try:
        msg = Message(subject, recipients=[email], html=body)
        mail.send(msg)
        print(f"--> Email sent to {email} with code {code}")
        return True
    except Exception as e:
        print(f"--> Failed to send email: {e}")
        # If in dev mode/console backend, it prints to stdout anyway via Flask-Mail
        return False

def verify_code(email, code, code_type):
    """
    Verifies the code and marks it as used.
    """
    record = VerificationCode.query.filter_by(
        email=email,
        code=code,
        type=code_type,
        used=False
    ).filter(VerificationCode.expires_at > datetime.utcnow()).first()

    if record:
        record.used = True
        db.session.commit()
        return True
    return False
