from flask import Blueprint, jsonify, request
from flask_login import login_required, current_user
from app.services import create_driver_application


driver = Blueprint("driver", __name__, url_prefix="/api/driver")


@driver.route("/apply", methods=["POST"])
@login_required
def apply():
    data = request.get_json() or {}
    license_info = data.get("license_info")

    _, error, status = create_driver_application(
        current_user.user_id,
        license_info=license_info,
    )

    if error:
        return jsonify({"message": error}), status

    return jsonify({"message": "driver application created successfully"}), 201
