from sqlalchemy.exc import SQLAlchemyError

from app.extensions import db
from app.models import DriverApplication, User


def get_current_user_profile(user_id):
    """
    Return the current user's profile and latest driver application.

    Args:
        user_id: The authenticated user's primary key.

    Returns:
        tuple: (payload, None, 200) on success, or
            (None, error_message, status_code) on failure.
    """
    user = db.session.get(User, user_id)
    if not user:
        return None, "User not found", 404

    latest_application = (
        DriverApplication.query.filter_by(user_id=user_id)
        .order_by(DriverApplication.created_at.desc())
        .first()
    )

    payload = {
        "user": user.to_dict(),
        "driver_application": (
            latest_application.to_dict() if latest_application else None
        ),
    }
    return payload, None, 200


def update_current_user_profile(user_id, data):
    """
    Update editable current-user profile fields.

    Args:
        user_id: The authenticated user's primary key.
        data: Dict with editable user fields.

    Returns:
        tuple: (payload, None, 200) on success, or
            (None, error_message, status_code) on failure.
    """
    user = db.session.get(User, user_id)
    if not user:
        return None, "User not found", 404

    display_name = data.get("display_name")
    if display_name is not None:
        normalized_name = " ".join(str(display_name).split())
        if not normalized_name:
            return None, "display_name required", 400
        name_parts = normalized_name.split(" ", 1)
        user.first_name = name_parts[0]
        user.last_name = name_parts[1] if len(name_parts) > 1 else ""

    if "email" in data:
        email = (data.get("email") or "").strip()
        if not email:
            return None, "email required", 400

        existing_user = User.query.filter_by(email=email).first()
        if existing_user and existing_user.user_id != user_id:
            return None, "user already exists", 409
        user.email = email

    if "address_street" in data:
        user.address_street = (data.get("address_street") or "").strip()
    if "address_city" in data:
        user.address_city = (data.get("address_city") or "").strip()
    if "address_state" in data:
        user.address_state = (data.get("address_state") or "").strip()
    if "address_zip" in data:
        user.address_zip = (data.get("address_zip") or "").strip()

    if not all(
        [
            user.first_name,
            user.email,
            user.address_street,
            user.address_city,
            user.address_state,
            user.address_zip,
        ]
    ):
        return None, "profile fields cannot be empty", 400

    try:
        db.session.commit()
    except SQLAlchemyError:
        db.session.rollback()
        return None, "Failed to update profile", 500

    return get_current_user_profile(user_id)
