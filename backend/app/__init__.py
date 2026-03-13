from datetime import timedelta
from sqlalchemy import event
from app.extensions import db
from app.routes.auth import auth
from app.routes.driver import driver
from flask import Flask, jsonify
from flask_cors import CORS
from flask_login import LoginManager


def create_app(test_config=None):
    """
    Create and configure the Flask application.

    Args:
        test_config: Optional dictionary of configuration
            overrides.

    Returns:
        Configured Flask application instance.
    """
    app = Flask(__name__)

    # CORS setup
    CORS(
        app,
        supports_credentials=True,
    )

    # Configuration
    app.config["SECRET_KEY"] = "your-secret-key-change-in-production"
    app.config["SQLALCHEMY_DATABASE_URI"] = "sqlite:///db.sqlite"
    app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False

    # Session configuration
    app.config["PERMANENT_SESSION_LIFETIME"] = timedelta(hours=24)
    app.config["SESSION_COOKIE_SECURE"] = (
        False  # Set True in production with HTTPS
    )
    app.config["SESSION_COOKIE_HTTPONLY"] = True  # Prevent XSS
    app.config["SESSION_COOKIE_SAMESITE"] = "Lax"  # CSRF protection
    app.config["SESSION_COOKIE_DOMAIN"] = None  # Allow any domain in dev

    # Override config for testing
    if test_config:
        app.config.update(test_config)

    # Initialize db with app
    db.init_app(app)

    # Enable FK enforcement for SQLite
    with app.app_context():

        @event.listens_for(db.engine, "connect")
        def set_sqlite_pragma(dbapi_conn, connection_record):
            cursor = dbapi_conn.cursor()
            cursor.execute("PRAGMA foreign_keys=ON")
            cursor.close()

        # Create tables
        db.create_all()

    # Configure Flask-login
    login_manager = LoginManager()
    login_manager.init_app(app)

    @login_manager.unauthorized_handler
    def unauthorized():
        return jsonify({"message": "Unauthorized"}), 401

    # User loader function for flask login
    from .models import User

    @login_manager.user_loader
    def load_user(user_id):
        return db.session.get(User, int(user_id))

    # Register blueprints
    app.register_blueprint(auth)
    app.register_blueprint(driver)

    # Add security headers to all responses
    @app.after_request
    def add_security_headers(response):
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
        return response

    # app health checks
    @app.route("/health")
    def health():
        return jsonify({"message": "App is running"})

    # Error handlers
    @app.errorhandler(404)
    def not_found(error):
        return jsonify({"message": "Not found"}), 404

    @app.errorhandler(405)
    def method_not_allowed(error):
        return jsonify({"message": "Method not allowed"}), 405

    @app.errorhandler(500)
    def server_error(error):
        return jsonify({"message": "Internal server error"}), 500

    return app
