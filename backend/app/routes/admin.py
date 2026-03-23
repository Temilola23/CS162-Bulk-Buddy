from flask import Blueprint, jsonify, request
from app.services import admin_service

admin = Blueprint("admin", __name__, url_prefix="/admin")
admin_required = admin_service.admin_required


@admin.route("/login", methods=["POST"])
def admin_login():
    """
    Authenticate an admin user and start a session.

    Args:
        Request JSON with 'email' and 'password' keys.

    Returns:
        JSON response with status 200 on success,
        401 if user not found or password incorrect,
        403 if user is not an admin.
    """
    data = request.get_json() or {}
    _, error, status = admin_service.authenticate_admin(data)
    if error:
        return jsonify({"message": error}), status
    return jsonify({"message": "login successful"}), 200


@admin.route("/register", methods=["POST"])
def register_admin():
    """
    Create a new admin account with token verification.

    Args:
        Request JSON with first_name, last_name, email,
        password, and admin_token.

    Returns:
        JSON response with status 201 on success,
        400 if required fields missing,
        403 if token invalid,
        409 if email already exists.
    """
    data = request.get_json() or {}
    _, error, status = admin_service.register_admin(data)

    if error:
        return jsonify({"message": error}), status
    return jsonify({"message": "admin created successfully"}), 201


@admin.route("/logout", methods=["POST"])
@admin_required
def logout():
    """
    End the current admin's session.

    Args:
        No request body required.

    Returns:
        JSON response with status 200 on success,
        401 if not authenticated,
        403 if not admin.
    """
    _, error, status = admin_service.logout_current_admin()
    if error:
        return jsonify({"message": error}), status

    return jsonify({"message": "user logout successful"}), 200


@admin.route("/pending")
@admin_required
def pending_apps():
    """
    Retrieve all driver applications with PENDING status.

    Args:
        No request body required.

    Returns:
        JSON response with pending_apps list and status 200 on success,
        401 if not authenticated,
        403 if not admin.
    """
    pending, error, status = admin_service.get_pending_driver_applications()
    if error:
        return jsonify({"message": error}), status
    return jsonify({"pending_apps": [a.to_dict() for a in pending]}), 200


@admin.route("/approved")
@admin_required
def approved_apps():
    """
    Retrieve all driver applications with APPROVED status.

    Args:
        No request body required.

    Returns:
        JSON response with approved_apps list and status 200 on success,
        401 if not authenticated,
        403 if not admin.
    """
    approved, error, status = admin_service.get_approved_applications()
    if error:
        return jsonify({"message": error}), status
    return jsonify({"approved_apps": [a.to_dict() for a in approved]}), 200


@admin.route("/rejected")
@admin_required
def rejected_apps():
    """
    Retrieve all driver applications with REJECTED status.

    Args:
        No request body required.

    Returns:
        JSON response with rejected_apps list and status 200 on success,
        401 if not authenticated,
        403 if not admin.
    """
    rejected, error, status = admin_service.get_rejected_applications()
    if error:
        return jsonify({"message": error}), status
    return jsonify({"rejected_apps": [a.to_dict() for a in rejected]}), 200


@admin.route("/decision/<int:app_id>", methods=["PUT"])
@admin_required
def change_app_status(app_id):
    """
    Update the status of a specific driver application.

    Args:
        app_id: The driver_application_id to update (from URL path).
        Request JSON with 'new_status' key.

    Returns:
        JSON response with status 200 on success,
        400 if new_status missing or application not found,
        401 if not authenticated,
        403 if not admin.
    """
    data = request.get_json() or {}
    _, error, status = admin_service.update_driver_application(app_id, data)
    if error:
        return jsonify({"message": error}), status
    return jsonify({"message": "driver application status updated"}), 200
