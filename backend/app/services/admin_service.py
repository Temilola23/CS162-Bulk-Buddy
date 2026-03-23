from werkzeug.security import generate_password_hash, check_password_hash
from flask_login import login_user, logout_user, current_user
from flask import abort
from app.extensions import db
from app.models import User, DriverApplication, ApplicationStatus, UserRole
from functools import wraps
from dotenv import load_dotenv
import os

load_dotenv()


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


def authenticate_admin(data):
    """
    Authenticate admin credentials and create a session.

    Args:
        data: Dictionary with 'email' and 'password' keys.

    Returns:
        tuple: (User, None, 200) on success, or
            (None, error_message, status_code) on failure.
    """
    email = data.get("email")
    password = data.get("password")
    try:
        user = User.query.filter_by(email=email).first()
        if not user:
            return None, "User not found", 401
        if not user.is_admin:
            return None, "Method not Authorized", 403
        if not check_password_hash(user.password_hash, password):
            return None, "Password incorrect", 401

        login_user(user)
        return user, None, 200
    except Exception as e:
        error_type = type(e).__name__
        error_message = str(e)
        return (
            None,
            f"Failed to authenticate admin. {error_type}:{error_message}",
            500,
        )


def register_admin(data):
    """
    Register a new admin user with token verification.

    Args:
        data: Dictionary with first_name, last_name, email,
              password, and admin_token.

    Returns:
        tuple: (User, None, 200) on success, or
            (None, error_message, status_code) on failure.
    """
    first_name = data.get("first_name")
    last_name = data.get("last_name")
    email = data.get("email")
    password = data.get("password")
    admin_token = data.get("admin_token")
    role = UserRole.ADMIN

    # Hardcoded address values because we don't care about admin address
    address_street = "street"
    address_city = "city"
    address_state = "state"
    address_zip = "zip"

    # Verify admin token matches environment variable
    if admin_token != os.environ.get("ADMIN_TOKEN"):
        return None, "invalid token", 403

    if not first_name:
        return None, "first name required", 400
    if not last_name:
        return None, "last name required", 400
    if not email or not password:
        return None, "email and password required", 400
    if not all([address_street, address_city, address_state, address_zip]):
        return None, "address (street, city, state, zip) required", 400

    existing_admin = User.query.filter_by(email=email).first()
    if existing_admin:
        return None, "Admin already exists", 409

    password_hash = generate_password_hash(password)
    new_admin = User(
        first_name=first_name,
        last_name=last_name,
        email=email,
        password_hash=password_hash,
        role=role,
        address_street=address_street,
        address_city=address_city,
        address_zip=address_zip,
        address_state=address_state,
    )

    try:
        db.session.add(new_admin)
        db.session.commit()
        return new_admin, None, 200
    except Exception as e:
        db.session.rollback()
        error_type = type(e).__name__
        error_message = str(e)
        return (
            None,
            f"Failed to register admin. {error_type}:{error_message}",
            500,
        )


def logout_current_admin():
    """
    Log out the current admin by clearing the session cookie.

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
            f"Failed to log out admin. {error_type}:{error_message}",
            500,
        )


def get_pending_driver_applications():
    """
    Retrieve all driver applications with PENDING status.

    Returns:
        tuple: (list[DriverApplication], None, 200) on success, or
            (None, error_message, status_code) on failure.
    """
    try:
        pending_applications = DriverApplication.query.filter_by(
            status=ApplicationStatus.PENDING
        ).all()
        return pending_applications, None, 200
    except Exception as e:
        error_type = type(e).__name__
        error_message = str(e)
        return (
            None,
            f"Failed to fetch pending applications.\
                  {error_type}:{error_message}",
            500,
        )


def get_approved_applications():
    """
    Retrieve all driver applications with APPROVED status.

    Returns:
        tuple: (list[DriverApplication], None, 200) on success, or
            (None, error_message, status_code) on failure.
    """
    try:
        approved_applications = DriverApplication.query.filter_by(
            status=ApplicationStatus.APPROVED
        ).all()
        return approved_applications, None, 200
    except Exception as e:
        error_type = type(e).__name__
        error_message = str(e)
        return (
            None,
            f"Failed to fetch approved applications.\
                  {error_type}:{error_message}",
            500,
        )


def get_rejected_applications():
    """
    Retrieve all driver applications with REJECTED status.

    Returns:
        tuple: (list[DriverApplication], None, 200) on success, or
            (None, error_message, status_code) on failure.
    """
    try:
        rejected_applications = DriverApplication.query.filter_by(
            status=ApplicationStatus.REJECTED
        ).all()
        return rejected_applications, None, 200
    except Exception as e:
        error_type = type(e).__name__
        error_message = str(e)
        return (
            None,
            f"Failed to fetch rejected applications.\
                  {error_type}:{error_message}",
            500,
        )


def update_driver_application(app_id, data):
    """
    Update a driver application's status.

    Args:
        app_id: The driver_application_id to update.
        data: Dictionary with 'new_status' key.

    Returns:
        tuple: (DriverApplication, None, 200) on success, or
            (None, error_message, status_code) on failure.
    """
    new_status = data.get("new_status")

    if not new_status:
        return None, "new status is needed", 400

    try:
        driver_application = DriverApplication.query.filter_by(
            driver_application_id=app_id
        ).first()

        if not driver_application:
            return None, f"Driver application for {app_id} does not exist", 400

        driver_application.status = new_status
        db.session.commit()
        return driver_application, None, 200
    except Exception as e:
        error_type = type(e).__name__
        error_message = str(e)
        return (
            None,
            f"Failed to update driver application.\
                {error_type}:{error_message}",
            500,
        )
