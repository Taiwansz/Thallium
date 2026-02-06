from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address
from flask_marshmallow import Marshmallow
from flasgger import Swagger

db = SQLAlchemy()
migrate = Migrate()
ma = Marshmallow()
limiter = Limiter(key_func=get_remote_address)
swagger = Swagger()
