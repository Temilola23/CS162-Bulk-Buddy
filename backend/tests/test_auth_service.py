from werkzeug.security import generate_password_hash

from app.extensions import db
from app.models import User
from app.models.enums import UserRole
from app.services.auth_service import (
    authenticate_user,
    logout_current_user,
    register_user,
)


def _make_user(email, password_plain="password123", role=UserRole.SHOPPER):
    """Helper to create a test user."""
    user = User(
        first_name="Test",
        last_name=role.value.title(),
        email=email,
        password_hash=generate_password_hash(password_plain),
        role=role,
        address_street="1 Test St",
        address_city="San Francisco",
        address_state="CA",
        address_zip="94101",
    )
    db.session.add(user)
    db.session.commit()
    return user


class TestAuthenticateUserService:
    """Service-level tests for authenticate_user function."""

    def test_authenticate_user_success(self, app):
        """Authenticate with correct credentials."""
        with app.app_context():
            _make_user("test@example.com", "password123")

            with app.test_request_context():
                user, error, status = authenticate_user(
                    "test@example.com", "password123"
                )

                assert error is None
                assert status == 200
                assert user is not None
                assert user.email == "test@example.com"

    def test_authenticate_user_not_found(self, app):
        """Authenticate with non-existent email."""
        with app.app_context():
            user, error, status = authenticate_user(
                "nonexistent@example.com", "password123"
            )

            assert user is None
            assert error == "user not found"
            assert status == 401

    def test_authenticate_user_wrong_password(self, app):
        """Authenticate with wrong password."""
        with app.app_context():
            _make_user("test@example.com", "password123")

            user, error, status = authenticate_user(
                "test@example.com", "wrongpassword"
            )

            assert user is None
            assert error == "wrong password"
            assert status == 401

    def test_authenticate_admin_insufficient_permissions(self, app):
        """Authenticate non-admin user with is_admin=True."""
        with app.app_context():
            _make_user("shopper@example.com", "password123", UserRole.SHOPPER)

            user, error, status = authenticate_user(
                "shopper@example.com", "password123", is_admin=True
            )

            assert user is None
            assert error == "insufficient permissions"
            assert status == 403


class TestRegisterUserService:
    """Service-level tests for register_user function."""

    def test_register_user_success(self, app):
        """Register a new shopper user."""
        with app.app_context():
            user, error, status = register_user(
                first_name="John",
                last_name="Doe",
                email="newuser@example.com",
                password="password123",
                address_street="123 Main St",
                address_city="San Francisco",
                address_state="CA",
                address_zip="94101",
            )

            assert error is None
            assert status == 201
            assert user is not None
            assert user.email == "newuser@example.com"
            assert user.role == UserRole.SHOPPER
            assert User.query.count() == 1

    def test_register_user_missing_first_name(self, app):
        """Register without first name."""
        with app.app_context():
            user, error, status = register_user(
                first_name="",
                last_name="Doe",
                email="newuser@example.com",
                password="password123",
                address_street="123 Main St",
                address_city="San Francisco",
                address_state="CA",
                address_zip="94101",
            )

            assert user is None
            assert error == "first name required"
            assert status == 400

    def test_register_user_missing_last_name(self, app):
        """Register without last name."""
        with app.app_context():
            user, error, status = register_user(
                first_name="John",
                last_name="",
                email="newuser@example.com",
                password="password123",
                address_street="123 Main St",
                address_city="San Francisco",
                address_state="CA",
                address_zip="94101",
            )

            assert user is None
            assert error == "last name required"
            assert status == 400

    def test_register_user_missing_email(self, app):
        """Register without email."""
        with app.app_context():
            user, error, status = register_user(
                first_name="John",
                last_name="Doe",
                email="",
                password="password123",
                address_street="123 Main St",
                address_city="San Francisco",
                address_state="CA",
                address_zip="94101",
            )

            assert user is None
            assert error == "email and password required"
            assert status == 400

    def test_register_user_missing_password(self, app):
        """Register without password."""
        with app.app_context():
            user, error, status = register_user(
                first_name="John",
                last_name="Doe",
                email="newuser@example.com",
                password="",
                address_street="123 Main St",
                address_city="San Francisco",
                address_state="CA",
                address_zip="94101",
            )

            assert user is None
            assert error == "email and password required"
            assert status == 400

    def test_register_user_missing_address_street(self, app):
        """Register without street address."""
        with app.app_context():
            user, error, status = register_user(
                first_name="John",
                last_name="Doe",
                email="newuser@example.com",
                password="password123",
                address_street="",
                address_city="San Francisco",
                address_state="CA",
                address_zip="94101",
            )

            assert user is None
            assert "address" in error.lower()
            assert status == 400

    def test_register_user_duplicate_email(self, app):
        """Register with email that already exists."""
        with app.app_context():
            _make_user("existing@example.com")

            user, error, status = register_user(
                first_name="John",
                last_name="Doe",
                email="existing@example.com",
                password="password123",
                address_street="123 Main St",
                address_city="San Francisco",
                address_state="CA",
                address_zip="94101",
            )

            assert user is None
            assert error == "user already exists"
            assert status == 409

    def test_register_admin_success_with_token(self, app, monkeypatch):
        """Register an admin user with correct token."""
        monkeypatch.setenv("ADMIN_TOKEN", "secret-admin-token")

        with app.app_context():
            user, error, status = register_user(
                first_name="Admin",
                last_name="User",
                email="admin@example.com",
                password="password123",
                address_street="123 Main St",
                address_city="San Francisco",
                address_state="CA",
                address_zip="94101",
                is_admin=True,
                admin_token="secret-admin-token",
            )

            assert error is None
            assert status == 201
            assert user.role == UserRole.ADMIN

    def test_register_admin_wrong_token(self, app, monkeypatch):
        """Register as admin with wrong token."""
        monkeypatch.setenv("ADMIN_TOKEN", "secret-admin-token")

        with app.app_context():
            user, error, status = register_user(
                first_name="Admin",
                last_name="User",
                email="admin@example.com",
                password="password123",
                address_street="123 Main St",
                address_city="San Francisco",
                address_state="CA",
                address_zip="94101",
                is_admin=True,
                admin_token="wrong-token",
            )

            assert user is None
            assert error == "invalid token"
            assert status == 403


class TestLogoutCurrentUserService:
    """Service-level tests for logout_current_user function."""

    def test_logout_success(self, app):
        """Logout a user."""
        with app.app_context():
            with app.test_request_context():
                result, error, status = logout_current_user()

                assert error is None
                assert status == 200
