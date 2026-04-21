import os
from datetime import timedelta
from sqlalchemy import event
from app.extensions import db
from app.routes.auth import auth
from app.routes.driver import driver
from app.routes.me import me
from app.routes.trip import trip
from app.routes.admin import admin
from flask import Flask, jsonify, request
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
    app.config["SECRET_KEY"] = os.environ.get(
        "SECRET_KEY", "dev-secret-key-change-in-production"
    )
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
            """Enable SQLite foreign-key enforcement for each connection."""
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
        """Return a JSON 401 response for unauthorized requests."""
        return jsonify({"message": "Unauthorized"}), 401

    # User loader function for flask login
    from .models import User

    @login_manager.user_loader
    def load_user(user_id):
        """Load the logged-in user instance from the session user id."""
        return db.session.get(User, int(user_id))

    # Register blueprints
    app.register_blueprint(auth)
    app.register_blueprint(driver)
    app.register_blueprint(me)
    app.register_blueprint(trip)
    app.register_blueprint(admin)

    @app.before_request
    def require_json_content_type():
        """Reject non-JSON content types on API mutation endpoints."""
        if (
            request.method in ("POST", "PUT", "PATCH")
            and request.path.startswith("/api/")
            and request.content_type
            and "application/json" not in request.content_type
        ):
            return (
                jsonify({"message": "Content-Type must be application/json"}),
                415,
            )

    # Add security headers to all responses
    @app.after_request
    def add_security_headers(response):
        """Attach basic security headers to every outgoing response."""
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
        return response

    # app health checks
    @app.route("/health")
    def health():
        """Return a simple health-check response for the running app."""
        return jsonify({"message": "App is running"})

    # Error handlers
    @app.errorhandler(401)
    def not_authenticated(error):
        return jsonify({"message": "Not authenticated"}), 401

    @app.errorhandler(403)
    def not_authorized(error):
        return jsonify({"message": "Not authorized"}), 403

    @app.errorhandler(404)
    def not_found(error):
        """Return a JSON 404 payload for unmatched routes."""
        return jsonify({"message": "Not found"}), 404

    @app.errorhandler(405)
    def method_not_allowed(error):
        """Return a JSON 405 payload for unsupported HTTP methods."""
        return jsonify({"message": "Method not allowed"}), 405

    @app.errorhandler(500)
    def server_error(error):
        """Return a JSON 500 payload for unhandled server errors."""
        return jsonify({"message": "Internal server error"}), 500

    return app
