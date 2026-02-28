"""Flask application factory for Bulk Buddy."""

from flask import Flask

from .extensions import db


def create_app(config=None):
    """Create and configure the Flask application.

    Args:
        config: Optional dictionary of configuration overrides.

    Returns:
        Configured Flask application instance.
    """
    app = Flask(__name__)

    app.config.setdefault(
        "SQLALCHEMY_DATABASE_URI", "sqlite:///bulkbuddy.db"
    )
    app.config.setdefault("SQLALCHEMY_TRACK_MODIFICATIONS", False)

    if config:
        app.config.update(config)

    db.init_app(app)

    # Import models so SQLAlchemy registers them before create_all
    from . import models  # noqa: F401

    with app.app_context():
        db.create_all()

    return app
