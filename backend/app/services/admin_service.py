from sqlalchemy.exc import SQLAlchemyError

from app.extensions import db
from app.models import ApplicationStatus, DriverApplication, User
from app.models.enums import UserRole


def get_driver_applications_by_status(status):
    """
    Retrieve driver applications filtered by status.

    Args:
        status: The ApplicationStatus to filter by
          (PENDING, APPROVED, REJECTED).

    Returns:
        tuple: (list[DriverApplication], None, 200) on success, or
            (None, error_message, status_code) on failure.
    """
    try:
        applications = DriverApplication.query.filter_by(status=status).all()
        return applications, None, 200
    except SQLAlchemyError:
        return None, "Failed to fetch applications", 500


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
        return None, "New status is needed", 400

    # Validate that new_status is a valid ApplicationStatus
    valid_statuses = [status.value for status in ApplicationStatus]
    if new_status not in valid_statuses:
        return (
            None,
            f"Invalid status. Must be one of: {', '.join(valid_statuses)}",
            400,
        )

    try:
        driver_application = DriverApplication.query.filter_by(
            driver_application_id=app_id
        ).first()

        if not driver_application:
            return None, f"Driver application for {app_id} does not exist", 404

        # Convert string status to enum
        application_status_enum = ApplicationStatus(new_status)
        driver_application.status = application_status_enum

        # Update user role based on application status
        user = User.query.filter_by(user_id=driver_application.user_id).first()
        if user:
            if application_status_enum == ApplicationStatus.APPROVED:
                user.role = UserRole.DRIVER
            elif application_status_enum == ApplicationStatus.REJECTED:
                user.role = UserRole.SHOPPER

        db.session.commit()
        return driver_application, None, 200
    except SQLAlchemyError:
        db.session.rollback()
        return None, "Failed to update driver application", 500
