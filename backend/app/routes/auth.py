from flask import Blueprint, jsonify, request
from flask_login import login_required
from app.services import auth_service

auth = Blueprint("auth", __name__, url_prefix="/api")


@auth.route("/login", methods=["POST"])
def login():
    """
    Authenticate a user and create a login session.

    Expects a JSON body with ``email`` and ``password``. The optional
    ``remember`` flag extends the session lifetime.

    Returns:
        Response: JSON ``{"message": ...}`` with HTTP 200 on success, or an
            error payload when credentials are invalid.
    """
    data = request.get_json() or {}
    email = data.get("email")
    password = data.get("password")
    remember = bool(data.get("remember"))  # Extends session cookie expiry

    _, error, status = auth_service.authenticate_user(
        email, password, remember
    )
    if error:
        return jsonify({"message": error}), status

    return jsonify({"message": "user logged in successfully"}), 200


@auth.route("/signup", methods=["POST"])
def signup():
    """
    Register a new user account.

    Expects the required identity, credential, and address fields used by
    ``register_user`` to create the shopper account.

    Returns:
        Response: JSON ``{"message": ...}`` with HTTP 201 on success, or an
            error payload when validation or uniqueness checks fail.
    """
    data = request.get_json() or {}
    email = data.get("email")
    password = data.get("password")
    first_name = data.get("first_name")
    last_name = data.get("last_name")
    address_street = data.get("address_street")
    address_city = data.get("address_city")
    address_state = data.get("address_state")
    address_zip = data.get("address_zip")

    _, error, status = auth_service.register_user(
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


@auth.route("/logout", methods=["POST"])
@login_required  # Returns 401 if no valid session
def logout():
    """
    End the authenticated user's session.

    Returns:
        Response: JSON ``{"message": ...}`` with HTTP 200 on success, or an
            error payload when logout fails unexpectedly.
    """
    _, error, status = auth_service.logout_current_user()
    if error:
        return jsonify({"message": error}), status

    return jsonify({"message": "user logout successful"}), 200
