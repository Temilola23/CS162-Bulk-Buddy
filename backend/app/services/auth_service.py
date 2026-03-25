from werkzeug.security import generate_password_hash, check_password_hash
from flask_login import login_user, logout_user
from app.models import User, UserRole
from app.extensions import db
from dotenv import load_dotenv
import os

load_dotenv()


def authenticate_user(email, password, remember=False, is_admin=False):
    """
    Authenticate user credentials and create a session.

    Args:
        email: User's email address.
        password: Plain text password to verify.
        remember: If True, extends session cookie expiry.
        is_admin: If True, register as admin user. Defaults to False.

    Returns:
        tuple: (User, None, 200) on success, or
            (None, error_message, status_code) on failure.
    """
    user = User.query.filter_by(email=email).first()

    if not user:
        return None, "user not found", 401
    if not check_password_hash(user.password_hash, password):
        return None, "wrong password", 401

    if is_admin and user.role != UserRole.ADMIN:
        return None, "insufficient permissions", 403

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
    is_admin=False,
    admin_token=None,
):
    """
    Register a new user account.

    Args:
        first_name: User's first name.
        last_name: User's last name.
        email: User's email address.
        password: Plain text password (will be hashed).
        address_street: Street portion of address.
        address_city: City portion of address.
        address_state: State/province portion of address.
        address_zip: ZIP / postal code.
        is_admin: If True, register as admin user. Defaults to False.
        admin_token: Required if is_admin=True. Must match ADMIN_TOKEN env var.

    Returns:
        tuple: (User, None, 201) on success, or
            (None, error_message, status_code) on failure.
    """
    if not first_name:
        return None, "first name required", 400
    if not last_name:
        return None, "last name required", 400
    if not email or not password:
        return None, "email and password required", 400
    if not all([address_street, address_city, address_state, address_zip]):
        return None, "address (street, city, state, zip) required", 400

    # Verify admin token if registering as admin
    if is_admin:
        if admin_token != os.environ.get("ADMIN_TOKEN"):
            return None, "invalid token", 403

    # Check if user already exists
    existing_user = User.query.filter_by(email=email).first()
    if existing_user:
        return None, "user already exists", 409

    password_hash = generate_password_hash(password)
    role = UserRole.ADMIN if is_admin else UserRole.SHOPPER
    new_user = User(
        email=email,
        password_hash=password_hash,
        first_name=first_name,
        last_name=last_name,
        address_street=address_street,
        address_city=address_city,
        address_state=address_state,
        address_zip=address_zip,
        role=role,
    )
    try:
        db.session.add(new_user)
        db.session.commit()
    except Exception as e:
        db.session.rollback()
        error_type = type(e).__name__
        error_message = str(e)
        return (
            None,
            f"Failed to register user {error_type}:{error_message}",
            500,
        )

    return new_user, None, 201


def logout_current_user():
    """
    Log out the current user by clearing the session cookie.

    Returns:
        tuple: (None, None, 200) on success, or
            (None, error_message, status_code) on failure.
    """
    try:
        logout_user()
        return None, None, 200
    except Exception as e:
        error_type = type(e).__name__
        error_message = str(e)
        return (
            None,
            f"Failed to log out user. {error_type}:{error_message}",
            500,
        )
