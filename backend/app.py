from pathlib import Path

from flask import Flask
from flask_login import LoginManager
from flask_sqlalchemy import SQLAlchemy
from .config import Config

# Initialize extensions
db = SQLAlchemy()
login_manager = LoginManager()

def create_app():
    project_root = Path(__file__).resolve().parent.parent
    app = Flask(
        __name__,
        template_folder=str(project_root / 'frontend' / 'templates'),
        static_folder=str(project_root / 'frontend' / 'static')
    )
    app.config.from_object(Config)

    # Initialize extensions with app
    db.init_app(app)
    login_manager.init_app(app)
    login_manager.login_view = 'auth.login'  # redirect if not logged in
    login_manager.login_message = 'Please log in to access this page.'

    # Register blueprints
    from .auth import auth as auth_blueprint
    app.register_blueprint(auth_blueprint)

    from .tasks import tasks as tasks_blueprint
    app.register_blueprint(tasks_blueprint)

    from .views import views as views_blueprint
    app.register_blueprint(views_blueprint)

    return app

@login_manager.user_loader
def load_user(user_id):
    from .models import User
    return User.query.get(int(user_id))
