from flask import Blueprint, jsonify, request
from flask_login import login_required
from app.services import auth_service

auth = Blueprint("auth", __name__, url_prefix="/api")


@auth.route("/login", methods=["POST"])
def login():
    """Authenticate user with email/password and create session."""
    try:
        data = request.get_json() or {}
        email = data.get("email")
        password = data.get("password")
        remember = bool(data.get("remember"))  # Extends session cookie expiry

        user, error, status = auth_service.authenticate_user(email, password, remember)
        if error:
            return jsonify({"message": error}), status

        return jsonify({"message": "user logged in successfully"}), 200
    except Exception as e:
        return jsonify({"message": f"Failed to log in. Error: {e}"}), 400


@auth.route("/signup", methods=["POST"])
def signup():
    """Register a new user account with email and password."""
    try:
        data = request.get_json() or {}
        email = data.get("email")
        password = data.get("password")
        first_name = data.get("first_name")
        last_name = data.get("last_name")
        address_street = data.get("address_street")
        address_city = data.get("address_city")
        address_state = data.get("address_state")
        address_zip = data.get("address_zip")

        user, error, status = auth_service.register_user(
            first_name,
            last_name,
            email,
            password,
            address_street,
            address_city,
            address_state,
            address_zip,
        )
        if error:
            return jsonify({"message": error}), status

        return jsonify({"message": "new user created successfully"}), 201
    except Exception as e:
        return jsonify({"message": f"Failed to sign up. Error: {e}"}), 400


@auth.route("/logout", methods=["POST"])
@login_required  # Returns 401 if no valid session
def logout():
    """End the current user's session."""
    try:
        auth_service.logout_current_user()
        return jsonify({"message": "user logout successful"}), 200
    except Exception as e:
        return jsonify({"message": f"Failed to log out. Error: {e}"}), 400
