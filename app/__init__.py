from flask import Flask
from .config import Config

def create_app(config_class=Config):
    app = Flask(__name__)
    app.config.from_object(config_class)

    from .database import init_app
    init_app(app)

    from .routes import auth, main
    app.register_blueprint(auth.bp)
    app.register_blueprint(main.bp)

    return app
