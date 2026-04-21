from werkzeug.security import generate_password_hash

from app.extensions import db
from app.models import DriverApplication, User
from app.models.enums import ApplicationStatus, UserRole
from app.services.driver_service import create_driver_application


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


class TestCreateDriverApplicationService:
    """Service-level tests for create_driver_application function."""

    def test_create_application_success(self, app):
        """Create a new driver application."""
        with app.app_context():
            user = _make_user("driver@example.com", UserRole.SHOPPER)

            app_obj, error, status = create_driver_application(
                user.user_id,
                license_info="DL123456",
            )

            assert error is None
            assert status == 201
            assert app_obj is not None
            assert app_obj.user_id == user.user_id
            assert app_obj.status == ApplicationStatus.PENDING
            assert app_obj.license_info == "DL123456"

    def test_create_application_already_driver(self, app):
        """Cannot create application if user is already a driver."""
        with app.app_context():
            user = _make_user("driver@example.com", UserRole.DRIVER)

            app_obj, error, status = create_driver_application(user.user_id)

            assert app_obj is None
            assert error == "User is already a driver"
            assert status == 409

    def test_create_application_already_pending(self, app):
        """Cannot create application if one is already pending."""
        with app.app_context():
            user = _make_user("driver@example.com", UserRole.SHOPPER)

            first_app = DriverApplication(
                user_id=user.user_id,
                status=ApplicationStatus.PENDING,
            )
            db.session.add(first_app)
            db.session.commit()

            app_obj, error, status = create_driver_application(user.user_id)

            assert app_obj is None
            assert error == "Driver application already pending review"
            assert status == 409

    def test_create_application_after_rejection_succeeds(self, app):
        """Can create new application after previous rejection."""
        with app.app_context():
            user = _make_user("driver@example.com", UserRole.SHOPPER)

            rejected_app = DriverApplication(
                user_id=user.user_id,
                status=ApplicationStatus.REJECTED,
            )
            db.session.add(rejected_app)
            db.session.commit()

            new_app, error, status = create_driver_application(user.user_id)

            assert error is None
            assert status == 201
            assert new_app.status == ApplicationStatus.PENDING
