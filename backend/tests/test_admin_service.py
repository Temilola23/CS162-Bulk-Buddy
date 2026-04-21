from werkzeug.security import generate_password_hash

from app.extensions import db
from app.models import DriverApplication, User
from app.models.enums import ApplicationStatus, UserRole
from app.services.admin_service import (
    get_driver_applications_by_status,
    update_driver_application,
)


def _make_user(email, role=UserRole.SHOPPER):
    """Helper to create a test user."""
    user = User(
        first_name="Test",
        last_name=role.value.title(),
        email=email,
        password_hash=generate_password_hash("password123"),
        role=role,
        address_street="1 Test St",
        address_city="San Francisco",
        address_state="CA",
        address_zip="94101",
    )
    db.session.add(user)
    db.session.commit()
    return user


class TestGetDriverApplicationsByStatusService:
    """Service-level tests for get_driver_applications_by_status function."""

    def test_get_applications_by_pending_status(self, app):
        """Retrieve all pending driver applications."""
        with app.app_context():
            user1 = _make_user("user1@example.com")
            user2 = _make_user("user2@example.com")

            app1 = DriverApplication(
                user_id=user1.user_id, status=ApplicationStatus.PENDING
            )
            app2 = DriverApplication(
                user_id=user2.user_id, status=ApplicationStatus.PENDING
            )
            app3 = DriverApplication(
                user_id=_make_user("user3@example.com").user_id,
                status=ApplicationStatus.APPROVED,
            )
            db.session.add_all([app1, app2, app3])
            db.session.commit()

            applications, error, status = get_driver_applications_by_status(
                ApplicationStatus.PENDING
            )

            assert error is None
            assert status == 200
            assert len(applications) == 2
            assert all(
                app.status == ApplicationStatus.PENDING for app in applications
            )

    def test_get_applications_by_approved_status(self, app):
        """Retrieve all approved driver applications."""
        with app.app_context():
            user1 = _make_user("user1@example.com")

            app1 = DriverApplication(
                user_id=user1.user_id,
                status=ApplicationStatus.APPROVED,
            )
            db.session.add(app1)
            db.session.commit()

            applications, error, status = get_driver_applications_by_status(
                ApplicationStatus.APPROVED
            )

            assert error is None
            assert status == 200
            assert len(applications) == 1
            assert applications[0].status == ApplicationStatus.APPROVED


class TestUpdateDriverApplicationService:
    """Service-level tests for update_driver_application function."""

    def test_update_application_approve(self, app):
        """Approve a pending driver application."""
        with app.app_context():
            user = _make_user("driver@example.com", UserRole.SHOPPER)
            app_obj = DriverApplication(
                user_id=user.user_id,
                status=ApplicationStatus.PENDING,
            )
            db.session.add(app_obj)
            db.session.commit()

            updated_app, error, status = update_driver_application(
                app_obj.driver_application_id,
                {"new_status": ApplicationStatus.APPROVED.value},
            )

            assert error is None
            assert status == 200
            assert updated_app.status == ApplicationStatus.APPROVED
            updated_user = db.session.get(User, user.user_id)
            assert updated_user.role == UserRole.DRIVER

    def test_update_application_reject(self, app):
        """Reject a pending driver application."""
        with app.app_context():
            user = _make_user("driver@example.com", UserRole.SHOPPER)
            app_obj = DriverApplication(
                user_id=user.user_id,
                status=ApplicationStatus.PENDING,
            )
            db.session.add(app_obj)
            db.session.commit()

            updated_app, error, status = update_driver_application(
                app_obj.driver_application_id,
                {"new_status": ApplicationStatus.REJECTED.value},
            )

            assert error is None
            assert status == 200
            assert updated_app.status == ApplicationStatus.REJECTED
            updated_user = db.session.get(User, user.user_id)
            assert updated_user.role == UserRole.SHOPPER

    def test_update_application_not_found(self, app):
        """Update non-existent driver application."""
        with app.app_context():
            app_obj, error, status = update_driver_application(
                99999,
                {"new_status": ApplicationStatus.APPROVED.value},
            )

            assert app_obj is None
            assert status == 404
            assert "does not exist" in error

    def test_update_application_already_decided(self, app):
        """Cannot update already-approved application."""
        with app.app_context():
            user = _make_user("driver@example.com", UserRole.DRIVER)
            app_obj = DriverApplication(
                user_id=user.user_id,
                status=ApplicationStatus.APPROVED,
            )
            db.session.add(app_obj)
            db.session.commit()

            updated_app, error, status = update_driver_application(
                app_obj.driver_application_id,
                {"new_status": ApplicationStatus.REJECTED.value},
            )

            assert updated_app is None
            assert error == "Only pending applications can be updated"
            assert status == 409

    def test_update_application_invalid_status(self, app):
        """Update with invalid status value."""
        with app.app_context():
            user = _make_user("driver@example.com", UserRole.SHOPPER)
            app_obj = DriverApplication(
                user_id=user.user_id,
                status=ApplicationStatus.PENDING,
            )
            db.session.add(app_obj)
            db.session.commit()

            updated_app, error, status = update_driver_application(
                app_obj.driver_application_id,
                {"new_status": "invalid_status"},
            )

            assert updated_app is None
            assert "Invalid status" in error
            assert status == 400

    def test_update_application_missing_status(self, app):
        """Update without new_status field."""
        with app.app_context():
            user = _make_user("driver@example.com", UserRole.SHOPPER)
            app_obj = DriverApplication(
                user_id=user.user_id,
                status=ApplicationStatus.PENDING,
            )
            db.session.add(app_obj)
            db.session.commit()

            updated_app, error, status = update_driver_application(
                app_obj.driver_application_id,
                {},
            )

            assert updated_app is None
            assert error == "new status is needed"
            assert status == 400
