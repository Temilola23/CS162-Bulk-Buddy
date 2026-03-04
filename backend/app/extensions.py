"""Shared Flask extensions.

Instantiated here and initialized in the app factory to avoid
circular imports between models and the application.
"""

from flask_sqlalchemy import SQLAlchemy

db = SQLAlchemy()
