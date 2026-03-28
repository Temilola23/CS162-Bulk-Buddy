from sqlalchemy.exc import SQLAlchemyError

from app.extensions import db
from app.models import DriverApplication, User
from app.models.enums import ApplicationStatus, UserRole


def create_driver_application(user_id, license_info=None):
    """
    Create a new driver application if no pending one exists.

    Args:
        user_id: The applicant's user id.
        license_info: Optional license metadata submitted
            with the application.

    Returns:
        tuple: (DriverApplication, None, 201) on success, or
            (None, error_message, status_code) on failure.
    """
    user = db.session.get(User, user_id)
    if user is not None and user.role == UserRole.DRIVER:
        return None, "User is already a driver", 409

    existing_pending_application = DriverApplication.query.filter_by(
        user_id=user_id,
        status=ApplicationStatus.PENDING,
    ).first()
    if existing_pending_application is not None:
        return None, "Driver application already pending review", 409

    try:
        driver_application = DriverApplication(
            user_id=user_id,
            license_info=license_info,
        )
        db.session.add(driver_application)
        db.session.commit()
        return driver_application, None, 201
    except SQLAlchemyError:
        db.session.rollback()
        return None, "Failed to create driver application", 500
