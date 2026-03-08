from werkzeug.security import generate_password_hash, check_password_hash
from flask_login import login_user, logout_user
from app.models import User
from app.extensions import db


def authenticate_user(email, password, remember=False):
    """
    Authenticate user credentials and create a session.

    Args:
        email: User's email address.
        password: Plain text password to verify.
        remember: If True, extends session cookie expiry.

    Returns:
        tuple: (User, None, 200) on success, or (None, error_message, status_code) on failure.
    """
    user = User.query.filter_by(email=email).first()

    if not user:
        return None, "user not found", 401
    if not check_password_hash(user.password_hash, password):
        return None, "wrong password", 401

    # Sets session cookie via Flask-Login
    login_user(user, remember=remember)
    return user, None, 200


def register_user(
    first_name,
    last_name,
    email,
    password,
    address_street,
    address_city,
    address_state,
    address_zip,
):
    """
    Register a new user account.

    Args:
        email: User's email address.
        password: Plain text password (will be hashed).

    Returns:
        tuple: (User, None, 201) on success, or (None, error_message, status_code) on failure.
    """
    if not first_name:
        return None, "first name required", 400
    if not last_name:
        return None, "last name required", 400
    if not email or not password:
        return None, "email and password required", 400
    if not all([address_street, address_city, address_state, address_zip]):
        return None, "address (street, city, state, zip) required", 400

    # Check if user already exists
    existing_user = User.query.filter_by(email=email).first()
    if existing_user:
        return None, "user already exists", 409

    password_hash = generate_password_hash(password)
    new_user = User(
        email=email,
        password_hash=password_hash,
        first_name=first_name,
        last_name=last_name,
        address_street=address_street,
        address_city=address_city,
        address_state=address_state,
        address_zip=address_zip,
    )
    db.session.add(new_user)
    db.session.commit()

    return new_user, None, 201


def logout_current_user():
    """Log out the current user by clearing the session cookie."""
    logout_user()
