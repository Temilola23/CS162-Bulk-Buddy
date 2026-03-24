from flask_login import current_user
from flask import abort
from functools import wraps


def admin_required(f):
    """
    Decorator that enforces admin authentication on protected routes.

    Returns 401 if user is not authenticated,
            403 if user lacks admin privileges.
    """

    @wraps(f)
    def decorated_function(*args, **kwargs):
        if not current_user.is_authenticated:
            abort(401)
        if not current_user.is_admin:
            abort(403)
        return f(*args, **kwargs)

    return decorated_function
