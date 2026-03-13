from app.extensions import db
from app.models import DriverApplication, User
from app.models.enums import ApplicationStatus, UserRole


class TestDriverApplicationRoute:
    """Tests for POST /api/driver/apply."""

    def test_apply_requires_login(self, client):
        """Unauthenticated users should receive 401."""
        response = client.post("/api/driver/apply", json={})

        assert response.status_code == 401
        assert response.json["message"] == "Unauthorized"

    def test_apply_creates_new_pending_application(self, auth_client, app):
        """Authenticated users can submit a new application."""
        response = auth_client.post(
            "/api/driver/apply",
            json={"license_info": "D1234567"},
        )

        assert response.status_code == 201
        assert response.json["message"] == "driver application created successfully"

        with app.app_context():
            application = DriverApplication.query.one()
            assert application.license_info == "D1234567"
            assert application.status == ApplicationStatus.PENDING

    def test_apply_rejects_second_pending_application(self, auth_client, app):
        """Users cannot create another application while one is pending."""
        auth_client.post(
            "/api/driver/apply",
            json={"license_info": "D1234567"},
        )

        response = auth_client.post(
            "/api/driver/apply",
            json={"license_info": "D7654321"},
        )

        assert response.status_code == 409
        assert response.json["message"] == "Driver application already pending review"

        with app.app_context():
            assert db.session.query(DriverApplication).count() == 1

    def test_apply_allows_resubmission_after_rejection(
        self, auth_client, app, test_user
    ):
        """Users can reapply after a previous rejection."""
        with app.app_context():
            db.session.add(
                DriverApplication(
                    user_id=test_user["user_id"],
                    status=ApplicationStatus.REJECTED,
                    license_info="OLD123",
                )
            )
            db.session.commit()

        response = auth_client.post(
            "/api/driver/apply",
            json={"license_info": "NEW123"},
        )

        assert response.status_code == 201

        with app.app_context():
            assert db.session.query(DriverApplication).count() == 2

    def test_apply_rejects_user_who_is_already_a_driver(self, client, app, test_user):
        """Approved drivers cannot create driver applications."""
        with app.app_context():
            user = db.session.get(User, test_user["user_id"])
            user.role = UserRole.DRIVER
            db.session.commit()

        client.post(
            "/api/login",
            json={
                "email": test_user["email"],
                "password": test_user["password"],
            },
        )

        response = client.post(
            "/api/driver/apply",
            json={"license_info": "D1234567"},
        )

        assert response.status_code == 409
        assert response.json["message"] == "User is already a driver"

        with app.app_context():
            assert db.session.query(DriverApplication).count() == 0
