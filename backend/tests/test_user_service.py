from werkzeug.security import generate_password_hash

from app.extensions import db
from app.models import DriverApplication, User
from app.models.enums import ApplicationStatus, UserRole
from app.services.user_service import (
    get_current_user_profile,
    update_current_user_profile,
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


class TestGetCurrentUserProfileService:
    """Service-level tests for get_current_user_profile function."""

    def test_get_profile_success(self, app):
        """Get a user's profile successfully."""
        with app.app_context():
            user = _make_user("test@example.com")

            payload, error, status = get_current_user_profile(user.user_id)

            assert error is None
            assert status == 200
            assert payload is not None
            assert payload["user"]["email"] == "test@example.com"
            assert payload["driver_application"] is None

    def test_get_profile_not_found(self, app):
        """Get profile for non-existent user."""
        with app.app_context():
            payload, error, status = get_current_user_profile(99999)

            assert payload is None
            assert error == "User not found"
            assert status == 404

    def test_get_profile_includes_driver_application(self, app):
        """Get profile includes the latest driver application."""
        with app.app_context():
            user = _make_user("test@example.com")

            app_obj = DriverApplication(
                user_id=user.user_id,
                status=ApplicationStatus.PENDING,
                license_info="test license",
            )
            db.session.add(app_obj)
            db.session.commit()

            payload, error, status = get_current_user_profile(user.user_id)

            assert error is None
            assert status == 200
            assert payload["driver_application"] is not None
            assert (
                payload["driver_application"]["license_info"] == "test license"
            )


class TestUpdateCurrentUserProfileService:
    """Service-level tests for update_current_user_profile function."""

    def test_update_profile_display_name(self, app):
        """Update user's display name."""
        with app.app_context():
            user = _make_user("test@example.com")

            payload, error, status = update_current_user_profile(
                user.user_id, {"display_name": "John Doe"}
            )

            assert error is None
            assert status == 200
            updated_user = db.session.get(User, user.user_id)
            assert updated_user.first_name == "John"
            assert updated_user.last_name == "Doe"

    def test_update_profile_email(self, app):
        """Update user's email."""
        with app.app_context():
            user = _make_user("test@example.com")

            payload, error, status = update_current_user_profile(
                user.user_id, {"email": "newemail@example.com"}
            )

            assert error is None
            assert status == 200
            updated_user = db.session.get(User, user.user_id)
            assert updated_user.email == "newemail@example.com"

    def test_update_profile_duplicate_email(self, app):
        """Cannot update email to one that already exists."""
        with app.app_context():
            existing_user = _make_user("test1@example.com")
            user2 = _make_user("test2@example.com")

            payload, error, status = update_current_user_profile(
                user2.user_id, {"email": existing_user.email}
            )

            assert payload is None
            assert error == "user already exists"
            assert status == 409

    def test_update_profile_empty_name(self, app):
        """Cannot update with empty display name."""
        with app.app_context():
            user = _make_user("test@example.com")

            payload, error, status = update_current_user_profile(
                user.user_id, {"display_name": "   "}
            )

            assert payload is None
            assert error == "display_name required"
            assert status == 400

    def test_update_profile_address_fields(self, app):
        """Update address fields."""
        with app.app_context():
            user = _make_user("test@example.com")

            payload, error, status = update_current_user_profile(
                user.user_id,
                {
                    "address_street": "456 New St",
                    "address_city": "New York",
                    "address_state": "NY",
                    "address_zip": "10001",
                },
            )

            assert error is None
            assert status == 200
            updated_user = db.session.get(User, user.user_id)
            assert updated_user.address_street == "456 New St"
            assert updated_user.address_city == "New York"
            assert updated_user.address_state == "NY"
            assert updated_user.address_zip == "10001"

    def test_update_profile_not_found(self, app):
        """Update profile for non-existent user."""
        with app.app_context():
            payload, error, status = update_current_user_profile(
                99999, {"display_name": "John Doe"}
            )

            assert payload is None
            assert error == "User not found"
            assert status == 404

    def test_update_profile_empty_email(self, app):
        """Cannot update with empty email."""
        with app.app_context():
            user = _make_user("test@example.com")

            payload, error, status = update_current_user_profile(
                user.user_id, {"email": ""}
            )

            assert payload is None
            assert error == "email required"
            assert status == 400
