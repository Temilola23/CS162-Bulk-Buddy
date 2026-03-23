from flask_login import login_user
from werkzeug.security import generate_password_hash

from app.extensions import db
from app.models import DriverApplication, User
from app.models.enums import ApplicationStatus, UserRole
from app.services import admin_service


class TestAdminService:
    """Service-layer behaviors without HTTP"""

    def test_authenticate_admin_success(self, app, admin_user):
        """
        Admin credentials yield a logged-in user and 200.

        Args:
            app: Flask application instance.
            admin_user: Fixture providing valid admin credentials.

        Returns:
            Asserts successful authentication with status 200 and user object.
        """
        with app.test_request_context():
            user, error, status = admin_service.authenticate_admin(
                {
                    "email": admin_user["email"],
                    "password": admin_user["password"],
                }
            )

        assert status == 200
        assert error is None
        assert user.email == admin_user["email"]

    def test_authenticate_admin_rejects_non_admin(self, app, test_user):
        """
        Non-admin users receive 403 even with correct credentials.

        Args:
            app: Flask application instance.
            test_user: Fixture providing non-admin user credentials.

        Returns:
            Asserts rejection with status 403 and no user object.
        """
        with app.test_request_context():
            user, error, status = admin_service.authenticate_admin(
                {
                    "email": test_user["email"],
                    "password": test_user["password"],
                }
            )

        assert user is None
        assert status == 403
        assert "Authorized" in error

    def test_authenticate_admin_wrong_password(self, app, admin_user):
        """
        Wrong password returns 401 and no user.

        Args:
            app: Flask application instance.
            admin_user: Fixture providing valid admin email.

        Returns:
            Asserts authentication failure with status 401.
        """
        with app.test_request_context():
            user, error, status = admin_service.authenticate_admin(
                {"email": admin_user["email"], "password": "badpass"}
            )

        assert user is None
        assert status == 401
        assert error == "Password incorrect"

    def test_authenticate_admin_user_not_found(self, app):
        """
        Unknown email returns 401.

        Args:
            app: Flask application instance.

        Returns:
            Asserts user not found with status 401.
        """
        with app.test_request_context():
            user, error, status = admin_service.authenticate_admin(
                {"email": "missing@example.com", "password": "irrelevant"}
            )

        assert user is None
        assert status == 401
        assert error == "User not found"

    def test_register_admin_requires_token(self, app, monkeypatch):
        """
        Rejects registration when admin_token is wrong.

        Args:
            app: Flask application instance.
            monkeypatch: Pytest fixture for mocking environment variables.

        Returns:
            Asserts rejection with status 403 and invalid token error.
        """
        monkeypatch.setenv("ADMIN_TOKEN", "secret-token")

        user, error, status = admin_service.register_admin(
            {
                "first_name": "A",
                "last_name": "B",
                "email": "newadmin@example.com",
                "password": "pass",
                "admin_token": "wrong-token",
            }
        )

        assert user is None
        assert status == 403
        assert error == "invalid token"

    def test_register_admin_creates_user(self, app, monkeypatch):
        """
        Creates an admin when token and fields are valid.

        Args:
            app: Flask application instance.
            monkeypatch: Pytest fixture for mocking environment variables.

        Returns:
            Asserts admin creation with status 200 and database persistence.
        """
        monkeypatch.setenv("ADMIN_TOKEN", "secret-token")

        user, error, status = admin_service.register_admin(
            {
                "first_name": "A",
                "last_name": "B",
                "email": "newadmin@example.com",
                "password": "pass",
                "admin_token": "secret-token",
            }
        )

        db_user = User.query.filter_by(email="newadmin@example.com").first()

        assert status == 200
        assert error is None
        assert db_user is not None
        assert db_user.role == UserRole.ADMIN

    def test_register_admin_duplicate_email(
        self, app, admin_user, monkeypatch
    ):
        """
        Prevents creating a second admin with the same email.

        Args:
            app: Flask application instance.
            admin_user: Fixture providing existing admin email.
            monkeypatch: Pytest fixture for mocking environment variables.

        Returns:
            Asserts rejection with status 409 and duplicate error.
        """
        monkeypatch.setenv("ADMIN_TOKEN", "secret-token")

        user, error, status = admin_service.register_admin(
            {
                "first_name": "Admin",
                "last_name": "User",
                "email": admin_user["email"],
                "password": "pass",
                "admin_token": "secret-token",
            }
        )

        assert user is None
        assert status == 409
        assert error == "Admin already exists"

    def test_get_pending_driver_applications_filters_status(
        self, app, admin_user
    ):
        """
        Only pending applications are returned.

        Args:
            app: Flask application instance.
            admin_user: Fixture providing admin user context.

        Returns:
            Asserts that only PENDING status applications are retrieved.
        """
        applicant = User(
            first_name="Pending",
            last_name="User",
            email="pending@example.com",
            password_hash=generate_password_hash("pass"),
            address_street="2 st",
            address_city="City",
            address_state="CA",
            address_zip="11111",
        )
        db.session.add(applicant)
        db.session.commit()

        db.session.add(
            DriverApplication(
                user_id=applicant.user_id,
                status=ApplicationStatus.PENDING,
                license_info="PEND1",
            )
        )
        db.session.add(
            DriverApplication(
                user_id=admin_user["user_id"],
                status=ApplicationStatus.APPROVED,
                license_info="APPROVED1",
            )
        )
        db.session.commit()

        pending, error, status = (
            admin_service.get_pending_driver_applications()
        )

        assert status == 200
        assert error is None
        assert len(pending) == 1
        assert pending[0].status == ApplicationStatus.PENDING

    def test_get_approved_driver_applications_filters_status(
        self, app, admin_user
    ):
        """
        Only approved applications are returned.

        Args:
            app: Flask application instance.
            admin_user: Fixture providing admin user context.

        Returns:
            Asserts that only APPROVED status applications are retrieved.
        """
        db.session.add(
            DriverApplication(
                user_id=admin_user["user_id"],
                status=ApplicationStatus.APPROVED,
                license_info="APPROVED1",
            )
        )
        db.session.commit()

        approved, error, status = admin_service.get_approved_applications()

        assert status == 200
        assert error is None
        assert len(approved) == 1
        assert approved[0].status == ApplicationStatus.APPROVED

    def test_get_rejected_driver_applications_filters_status(
        self, app, admin_user
    ):
        """
        Only rejected applications are returned.

        Args:
            app: Flask application instance.
            admin_user: Fixture providing admin user context.

        Returns:
            Asserts that only REJECTED status applications are retrieved.
        """
        db.session.add(
            DriverApplication(
                user_id=admin_user["user_id"],
                status=ApplicationStatus.REJECTED,
                license_info="REJ1",
            )
        )
        db.session.commit()

        rejected, error, status = admin_service.get_rejected_applications()

        assert status == 200
        assert error is None
        assert len(rejected) == 1
        assert rejected[0].status == ApplicationStatus.REJECTED

    def test_update_driver_application_missing_status(self, app):
        """
        Missing new_status yields 400.

        Args:
            app: Flask application instance.

        Returns:
            Asserts validation error with status 400.
        """
        _, error, status = admin_service.update_driver_application(1, {})

        assert status == 400
        assert error == "new status is needed"

    def test_update_driver_application_not_found(self, app):
        """
        Nonexistent application returns 400 with message.

        Args:
            app: Flask application instance.

        Returns:
            Asserts not found error with status 400.
        """
        _, error, status = admin_service.update_driver_application(
            999, {"new_status": ApplicationStatus.APPROVED}
        )

        assert status == 400
        assert "does not exist" in error

    def test_update_driver_application_updates_status(self, app, admin_user):
        """
        Valid update changes status and returns 200.

        Args:
            app: Flask application instance.
            admin_user: Fixture providing admin user context.

        Returns:
            Asserts successful update with status 200 and changed status field.
        """
        application = DriverApplication(
            user_id=admin_user["user_id"],
            status=ApplicationStatus.PENDING,
            license_info="LIC1",
        )
        db.session.add(application)
        db.session.commit()

        updated, error, status = admin_service.update_driver_application(
            application.driver_application_id,
            {"new_status": ApplicationStatus.APPROVED},
        )

        assert status == 200
        assert error is None
        assert updated.status == ApplicationStatus.APPROVED

    def test_logout_current_admin(self, app, admin_user):
        """
        Logged-in admin can log out without error.

        Args:
            app: Flask application instance.
            admin_user: Fixture providing admin user context.

        Returns:
            Asserts successful logout with status 200 and no error.
        """
        with app.test_request_context():
            user = db.session.get(User, admin_user["user_id"])
            login_user(user)
            _, error, status = admin_service.logout_current_admin()

        assert status == 200
        assert error is None


class TestAdminRoutes:
    """HTTP-layer behaviors and permission checks for /admin routes."""

    def test_admin_login_succeeds_for_admin_user(self, client, admin_user):
        """
        Admin can log in via /admin/login.

        Args:
            client: Flask test client.
            admin_user: Fixture providing valid admin credentials.

        Returns:
            Asserts successful login response with status 200.
        """
        response = client.post(
            "/admin/login",
            json={
                "email": admin_user["email"],
                "password": admin_user["password"],
            },
        )

        assert response.status_code == 200
        assert response.json["message"] == "login successful"

    def test_admin_login_rejects_non_admin_user(self, client, test_user):
        """
        Non-admin users are blocked from /admin/login.

        Args:
            client: Flask test client.
            test_user: Fixture providing non-admin user credentials.

        Returns:
            Asserts rejection with status 403.
        """
        response = client.post(
            "/admin/login",
            json={
                "email": test_user["email"],
                "password": test_user["password"],
            },
        )

        assert response.status_code == 403
        assert "Authorized" in response.json["message"]

    def test_admin_register_route_creates_admin(self, client, monkeypatch):
        """
        Route creates an admin when token is valid.

        Args:
            client: Flask test client.
            monkeypatch: Pytest fixture for mocking environment variables.

        Returns:
            Asserts successful admin creation with status 201.
        """
        monkeypatch.setenv("ADMIN_TOKEN", "secret-token")

        response = client.post(
            "/admin/register",
            json={
                "first_name": "Route",
                "last_name": "Admin",
                "email": "routeadmin@example.com",
                "password": "pass",
                "admin_token": "secret-token",
            },
        )

        assert response.status_code == 201
        assert response.json["message"] == "admin created successfully"

    def test_pending_apps_requires_authentication(self, client):
        """
        Unauthenticated access returns 401.

        Args:
            client: Flask test client without authentication.

        Returns:
            Asserts unauthorized response with status 401.
        """
        response = client.get("/admin/pending")

        assert response.status_code == 401
        assert response.json["message"] == "Not authenticated"

    def test_pending_apps_requires_admin_role(self, client, test_user):
        """
        Authenticated non-admin receives 403.

        Args:
            client: Flask test client.
            test_user: Fixture providing non-admin user credentials.

        Returns:
            Asserts forbidden response with status 403.
        """
        client.post(
            "/api/login",
            json={
                "email": test_user["email"],
                "password": test_user["password"],
            },
        )

        response = client.get("/admin/pending")

        assert response.status_code == 403
        assert response.json["message"] == "Not authorized"

    def test_pending_apps_success(self, admin_client, app, admin_user):
        """
        Admin can retrieve pending applications.

        Args:
            admin_client: Flask test client authenticated as admin.
            app: Flask application instance.
            admin_user: Fixture providing admin user context.

        Returns:
            Asserts successful retrieval with status 200 and applications list.
        """
        applicant = User(
            first_name="Pending",
            last_name="User",
            email="pending@example.com",
            password_hash=generate_password_hash("pass"),
            address_street="2 st",
            address_city="City",
            address_state="CA",
            address_zip="11111",
        )
        db.session.add(applicant)
        db.session.commit()

        db.session.add(
            DriverApplication(
                user_id=applicant.user_id,
                status=ApplicationStatus.PENDING,
                license_info="PEND1",
            )
        )
        db.session.commit()

        response = admin_client.get("/admin/pending")

        assert response.status_code == 200
        assert "pending_apps" in response.json
        assert len(response.json["pending_apps"]) == 1
        assert response.json["pending_apps"][0]["status"] == "pending"

    def test_admin_logout(self, admin_client):
        """
        Admin logout route succeeds.

        Args:
            admin_client: Flask test client authenticated as admin.

        Returns:
            Asserts successful logout with status 200.
        """
        response = admin_client.post("/admin/logout")

        assert response.status_code == 200
        assert response.json["message"] == "user logout successful"

    def test_admin_logout_requires_login(self, client):
        """
        Unauthenticated logout returns 401.

        Args:
            client: Flask test client without authentication.

        Returns:
            Asserts unauthorized response with status 401.
        """
        response = client.post("/admin/logout")

        assert response.status_code == 401
        assert response.json["message"] == "Not authenticated"
