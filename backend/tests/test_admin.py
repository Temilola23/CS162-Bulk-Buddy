from werkzeug.security import generate_password_hash
from app.extensions import db
from app.models import DriverApplication, User
from app.models.enums import ApplicationStatus, UserRole
from app.services import admin_service, auth_service


class TestAdminService:
    """Test admin service functions."""

    def test_get_driver_applications_by_status_pending(self, app, admin_user):
        """Returns only PENDING applications."""
        with app.app_context():
            # Create users
            applicant1 = User(
                first_name="John",
                last_name="Doe",
                email="john@example.com",
                password_hash=generate_password_hash("password"),
                address_street="123 Main St",
                address_city="Boston",
                address_state="MA",
                address_zip="02101",
            )
            applicant2 = User(
                first_name="Jane",
                last_name="Smith",
                email="jane@example.com",
                password_hash=generate_password_hash("password"),
                address_street="456 Oak Ave",
                address_city="Boston",
                address_state="MA",
                address_zip="02102",
            )
            db.session.add_all([applicant1, applicant2])
            db.session.commit()

            # Create applications with different statuses
            app1 = DriverApplication(
                user_id=applicant1.user_id,
                status=ApplicationStatus.PENDING,
                license_info="DL123456",
            )
            app2 = DriverApplication(
                user_id=applicant2.user_id,
                status=ApplicationStatus.APPROVED,
                license_info="DL789012",
            )
            db.session.add_all([app1, app2])
            db.session.commit()

            # Test retrieval
            apps, error, status = (
                admin_service.get_driver_applications_by_status(
                    ApplicationStatus.PENDING
                )
            )

            assert status == 200
            assert error is None
            assert len(apps) == 1
            assert apps[0].status == ApplicationStatus.PENDING

    def test_get_driver_applications_by_status_approved(self, app):
        """Returns only APPROVED applications."""
        with app.app_context():
            # Create user
            applicant = User(
                first_name="Bob",
                last_name="Jones",
                email="bob@example.com",
                password_hash=generate_password_hash("password"),
                address_street="789 Pine Rd",
                address_city="Boston",
                address_state="MA",
                address_zip="02103",
            )
            db.session.add(applicant)
            db.session.commit()

            # Create application
            app_record = DriverApplication(
                user_id=applicant.user_id,
                status=ApplicationStatus.APPROVED,
                license_info="DL345678",
            )
            db.session.add(app_record)
            db.session.commit()

            # Test retrieval
            apps, error, status = (
                admin_service.get_driver_applications_by_status(
                    ApplicationStatus.APPROVED
                )
            )

            assert status == 200
            assert error is None
            assert len(apps) == 1

    def test_get_driver_applications_by_status_rejected(self, app):
        """Returns only REJECTED applications."""
        with app.app_context():
            # Create user
            applicant = User(
                first_name="Alice",
                last_name="Brown",
                email="alice@example.com",
                password_hash=generate_password_hash("password"),
                address_street="100 Elm St",
                address_city="Boston",
                address_state="MA",
                address_zip="02104",
            )
            db.session.add(applicant)
            db.session.commit()

            # Create application
            app_record = DriverApplication(
                user_id=applicant.user_id,
                status=ApplicationStatus.REJECTED,
                license_info="DL111222",
            )
            db.session.add(app_record)
            db.session.commit()

            # Test retrieval
            apps, error, status = (
                admin_service.get_driver_applications_by_status(
                    ApplicationStatus.REJECTED
                )
            )

            assert status == 200
            assert error is None
            assert len(apps) == 1

    def test_get_driver_applications_empty(self, app):
        """Returns empty list when no applications match the status."""
        with app.app_context():
            apps, error, status = (
                admin_service.get_driver_applications_by_status(
                    ApplicationStatus.PENDING
                )
            )

            assert status == 200
            assert error is None
            assert len(apps) == 0

    def test_update_driver_application_missing_status(self, app):
        """Returns 400 error when new_status is not provided."""
        with app.app_context():
            app_obj, error, status = admin_service.update_driver_application(
                1, {}
            )

            assert status == 400
            assert error == "new status is needed"
            assert app_obj is None

    def test_update_driver_application_invalid_status(self, app):
        """Returns 400 error when new_status is invalid."""
        with app.app_context():
            app_obj, error, status = admin_service.update_driver_application(
                1, {"new_status": "invalid_status"}
            )

            assert status == 400
            assert "Invalid status" in error
            assert app_obj is None

    def test_update_driver_application_not_found(self, app):
        """Returns 404 error when application doesn't exist."""
        with app.app_context():
            app_obj, error, status = admin_service.update_driver_application(
                999, {"new_status": "approved"}
            )

            assert status == 404
            assert app_obj is None

    def test_update_driver_application_approve_updates_user_role(self, app):
        """Approving an application updates user role to DRIVER."""
        with app.app_context():
            # Create user
            applicant = User(
                first_name="Chris",
                last_name="Davis",
                email="chris@example.com",
                password_hash=generate_password_hash("password"),
                address_street="200 Maple Dr",
                address_city="Boston",
                address_state="MA",
                address_zip="02105",
                role=UserRole.SHOPPER,
            )
            db.session.add(applicant)
            db.session.commit()

            # Create pending application
            app_record = DriverApplication(
                user_id=applicant.user_id,
                status=ApplicationStatus.PENDING,
                license_info="DL555666",
            )
            db.session.add(app_record)
            db.session.commit()
            app_id = app_record.driver_application_id

            # Update to approved
            app_obj, error, status = admin_service.update_driver_application(
                app_id, {"new_status": "approved"}
            )

            assert status == 200
            assert error is None
            assert app_obj.status == ApplicationStatus.APPROVED

            # Verify user role was updated
            updated_user = User.query.filter_by(
                user_id=applicant.user_id
            ).first()
            assert updated_user.role == UserRole.DRIVER

    def test_update_driver_application_reject_updates_user_role(self, app):
        """Rejecting an application updates user role back to SHOPPER."""
        with app.app_context():
            # Create user
            applicant = User(
                first_name="Diana",
                last_name="Elvis",
                email="diana@example.com",
                password_hash=generate_password_hash("password"),
                address_street="300 Birch Ave",
                address_city="Boston",
                address_state="MA",
                address_zip="02106",
                role=UserRole.SHOPPER,
            )
            db.session.add(applicant)
            db.session.commit()

            # Create pending application
            app_record = DriverApplication(
                user_id=applicant.user_id,
                status=ApplicationStatus.PENDING,
                license_info="DL777888",
            )
            db.session.add(app_record)
            db.session.commit()
            app_id = app_record.driver_application_id

            # Update to rejected
            app_obj, error, status = admin_service.update_driver_application(
                app_id, {"new_status": "rejected"}
            )

            assert status == 200
            assert error is None
            assert app_obj.status == ApplicationStatus.REJECTED

            # Verify user role stays as SHOPPER
            updated_user = User.query.filter_by(
                user_id=applicant.user_id
            ).first()
            assert updated_user.role == UserRole.SHOPPER


class TestAuthServiceAdmin:
    """Test admin-related auth service functions."""

    def test_authenticate_user_admin_success(
        self, app, admin_user, monkeypatch
    ):
        """Admin credentials with is_admin=True return 200 and user."""
        with app.test_request_context():
            user, error, status = auth_service.authenticate_user(
                email=admin_user["email"],
                password=admin_user["password"],
                is_admin=True,
            )

            assert status == 200
            assert error is None
            assert user.email == admin_user["email"]
            assert user.role == UserRole.ADMIN

    def test_authenticate_user_admin_wrong_password(self, app, admin_user):
        """Admin login with wrong password returns 401."""
        with app.test_request_context():
            user, error, status = auth_service.authenticate_user(
                email=admin_user["email"],
                password="wrongpass",
                is_admin=True,
            )

            assert status == 401
            assert error == "wrong password"
            assert user is None

    def test_authenticate_user_admin_not_found(self, app):
        """Admin login with non-existent email returns 401."""
        with app.test_request_context():
            user, error, status = auth_service.authenticate_user(
                email="nonexistent@example.com",
                password="somepass",
                is_admin=True,
            )

            assert status == 401
            assert error == "user not found"
            assert user is None

    def test_authenticate_user_non_admin_with_admin_flag(self, app, test_user):
        """Non-admin user cannot authenticate with is_admin=True flag."""
        with app.test_request_context():
            user, error, status = auth_service.authenticate_user(
                email=test_user["email"],
                password=test_user["password"],
                is_admin=True,
            )

            assert status == 403
            assert error == "insufficient permissions"
            assert user is None

    def test_register_user_admin_success(self, app, monkeypatch):
        """Admin registration with valid token creates admin user."""
        monkeypatch.setenv("ADMIN_TOKEN", "secret-admin-token")

        with app.app_context():
            user, error, status = auth_service.register_user(
                first_name="New",
                last_name="Admin",
                email="newadmin@example.com",
                password="adminpass123",
                address_street="999 Admin Blvd",
                address_city="AdminCity",
                address_state="AC",
                address_zip="99999",
                is_admin=True,
                admin_token="secret-admin-token",
            )

            assert status == 201
            assert error is None
            assert user.role == UserRole.ADMIN
            assert user.email == "newadmin@example.com"

    def test_register_user_admin_invalid_token(self, app, monkeypatch):
        """Admin registration with wrong token returns 403."""
        monkeypatch.setenv("ADMIN_TOKEN", "correct-token")

        with app.app_context():
            user, error, status = auth_service.register_user(
                first_name="Bad",
                last_name="Admin",
                email="badmin@example.com",
                password="pass123",
                address_street="888 Bad Ave",
                address_city="BadCity",
                address_state="BC",
                address_zip="88888",
                is_admin=True,
                admin_token="wrong-token",
            )

            assert status == 403
            assert error == "invalid token"
            assert user is None

    def test_register_user_admin_missing_token(self, app, monkeypatch):
        """Admin registration without token defaults to wrong token error."""
        monkeypatch.setenv("ADMIN_TOKEN", "some-token")

        with app.app_context():
            user, error, status = auth_service.register_user(
                first_name="No",
                last_name="Token",
                email="notoken@example.com",
                password="pass123",
                address_street="777 No Token Ln",
                address_city="NoTokenCity",
                address_state="NT",
                address_zip="77777",
                is_admin=True,
                admin_token=None,
            )

            assert status == 403
            assert error == "invalid token"
            assert user is None

    def test_register_user_admin_duplicate_email(
        self, app, admin_user, monkeypatch
    ):
        """Admin registration with existing email returns 409."""
        monkeypatch.setenv("ADMIN_TOKEN", "valid-token")

        with app.app_context():
            user, error, status = auth_service.register_user(
                first_name="Dup",
                last_name="Admin",
                email=admin_user["email"],
                password="pass123",
                address_street="666 Dup St",
                address_city="DupCity",
                address_state="DC",
                address_zip="66666",
                is_admin=True,
                admin_token="valid-token",
            )

            assert status == 409
            assert error == "user already exists"
            assert user is None

    def test_register_user_admin_missing_required_fields(
        self, app, monkeypatch
    ):
        """Admin registration with missing required fields returns 400."""
        monkeypatch.setenv("ADMIN_TOKEN", "valid-token")

        with app.app_context():
            # Missing first_name
            user, error, status = auth_service.register_user(
                first_name=None,
                last_name="Admin",
                email="test@example.com",
                password="pass123",
                address_street="555 Test St",
                address_city="TestCity",
                address_state="TC",
                address_zip="55555",
                is_admin=True,
                admin_token="valid-token",
            )

            assert status == 400
            assert "first name" in error.lower()
            assert user is None


class TestAdminRoutes:
    """Test admin API routes."""

    def test_admin_login_success(self, client, admin_user, app):
        """Admin login with valid credentials returns 200."""
        response = client.post(
            "/admin/login",
            json={
                "email": admin_user["email"],
                "password": admin_user["password"],
            },
        )

        assert response.status_code == 200
        assert "login successful" in response.get_json()["message"]

    def test_admin_login_wrong_password(self, client, admin_user):
        """Admin login with wrong password returns 401."""
        response = client.post(
            "/admin/login",
            json={"email": admin_user["email"], "password": "wrongpass"},
        )

        assert response.status_code == 401

    def test_admin_login_non_admin_user(self, client, test_user):
        """Non-admin login attempt returns 403."""
        response = client.post(
            "/admin/login",
            json={
                "email": test_user["email"],
                "password": test_user["password"],
            },
        )

        assert response.status_code == 403

    def test_admin_register_success(self, client, monkeypatch):
        """Admin registration with valid token returns 201."""
        monkeypatch.setenv("ADMIN_TOKEN", "secret-token")

        response = client.post(
            "/admin/register",
            json={
                "first_name": "New",
                "last_name": "Admin",
                "email": "newadmin@example.com",
                "password": "pass123",
                "address_street": "123 New St",
                "address_city": "NewCity",
                "address_state": "NC",
                "address_zip": "12345",
                "admin_token": "secret-token",
            },
        )

        assert response.status_code == 201
        assert "admin created successfully" in response.get_json()["message"]

    def test_admin_register_invalid_token(self, client, monkeypatch):
        """Admin registration with invalid token returns 403."""
        monkeypatch.setenv("ADMIN_TOKEN", "correct-token")

        response = client.post(
            "/admin/register",
            json={
                "first_name": "Bad",
                "last_name": "Admin",
                "email": "bad@example.com",
                "password": "pass123",
                "address_street": "456 Bad Ave",
                "address_city": "BadCity",
                "address_state": "BC",
                "address_zip": "54321",
                "admin_token": "wrong-token",
            },
        )

        assert response.status_code == 403

    def test_admin_register_duplicate_email(
        self, client, admin_user, monkeypatch
    ):
        """Admin registration with duplicate email returns 409."""
        monkeypatch.setenv("ADMIN_TOKEN", "valid-token")

        response = client.post(
            "/admin/register",
            json={
                "first_name": "Dup",
                "last_name": "Admin",
                "email": admin_user["email"],
                "password": "pass123",
                "address_street": "789 Dup Ln",
                "address_city": "DupCity",
                "address_state": "DC",
                "address_zip": "98765",
                "admin_token": "valid-token",
            },
        )

        assert response.status_code == 409

    def test_admin_logout_success(self, admin_client, admin_user):
        """Admin logout returns 200."""
        response = admin_client.post("/admin/logout")

        assert response.status_code == 200
        assert "logout successful" in response.get_json()["message"]

    def test_admin_logout_not_authenticated(self, client):
        """Logout without authentication returns 401."""
        response = client.post("/admin/logout")

        assert response.status_code == 401

    def test_get_pending_applications_success(self, admin_client, app):
        """Get pending applications returns 200 with list."""
        with app.app_context():
            # Create a pending application
            applicant = User(
                first_name="Pending",
                last_name="Driver",
                email="pending@example.com",
                password_hash=generate_password_hash("pass"),
                address_street="100 Pending St",
                address_city="PendingCity",
                address_state="PC",
                address_zip="11111",
            )
            db.session.add(applicant)
            db.session.commit()

            app_record = DriverApplication(
                user_id=applicant.user_id,
                status=ApplicationStatus.PENDING,
                license_info="DL999888",
            )
            db.session.add(app_record)
            db.session.commit()

        response = admin_client.get("/admin/pending")

        assert response.status_code == 200
        data = response.get_json()
        assert "pending_apps" in data

    def test_get_pending_applications_not_admin(self, client, test_user):
        """Non-admin cannot access pending applications returns 403."""
        # Login as non-admin
        client.post(
            "/api/login",
            json={
                "email": test_user["email"],
                "password": test_user["password"],
            },
        )

        response = client.get("/admin/pending")

        assert response.status_code == 403

    def test_get_approved_applications_success(self, admin_client, app):
        """Get approved applications returns 200 with list."""
        with app.app_context():
            # Create an approved application
            applicant = User(
                first_name="Approved",
                last_name="Driver",
                email="approved@example.com",
                password_hash=generate_password_hash("pass"),
                address_street="200 Approved Ave",
                address_city="ApprovedCity",
                address_state="AC",
                address_zip="22222",
                role=UserRole.DRIVER,
            )
            db.session.add(applicant)
            db.session.commit()

            app_record = DriverApplication(
                user_id=applicant.user_id,
                status=ApplicationStatus.APPROVED,
                license_info="DL111222",
            )
            db.session.add(app_record)
            db.session.commit()

        response = admin_client.get("/admin/approved")

        assert response.status_code == 200
        data = response.get_json()
        assert "approved_apps" in data

    def test_get_rejected_applications_success(self, admin_client, app):
        """Get rejected applications returns 200 with list."""
        with app.app_context():
            # Create a rejected application
            applicant = User(
                first_name="Rejected",
                last_name="Driver",
                email="rejected@example.com",
                password_hash=generate_password_hash("pass"),
                address_street="300 Rejected Rd",
                address_city="RejectedCity",
                address_state="RC",
                address_zip="33333",
            )
            db.session.add(applicant)
            db.session.commit()

            app_record = DriverApplication(
                user_id=applicant.user_id,
                status=ApplicationStatus.REJECTED,
                license_info="DL333444",
            )
            db.session.add(app_record)
            db.session.commit()

        response = admin_client.get("/admin/rejected")

        assert response.status_code == 200
        data = response.get_json()
        assert "rejected_apps" in data

    def test_change_app_status_success(self, admin_client, app):
        """Changing application status returns 200."""
        with app.app_context():
            # Create a pending application
            applicant = User(
                first_name="Status",
                last_name="Change",
                email="status@example.com",
                password_hash=generate_password_hash("pass"),
                address_street="400 Status Blvd",
                address_city="StatusCity",
                address_state="SC",
                address_zip="44444",
            )
            db.session.add(applicant)
            db.session.commit()

            app_record = DriverApplication(
                user_id=applicant.user_id,
                status=ApplicationStatus.PENDING,
                license_info="DL555666",
            )
            db.session.add(app_record)
            db.session.commit()
            app_id = app_record.driver_application_id

        response = admin_client.put(
            f"/admin/decision/{app_id}",
            json={"new_status": "approved"},
        )

        assert response.status_code == 200
        assert "status updated" in response.get_json()["message"]

    def test_change_app_status_invalid_status(self, admin_client, app):
        """Changing to invalid status returns 400."""
        with app.app_context():
            # Create a pending application
            applicant = User(
                first_name="Invalid",
                last_name="Status",
                email="invalid@example.com",
                password_hash=generate_password_hash("pass"),
                address_street="500 Invalid St",
                address_city="InvalidCity",
                address_state="IS",
                address_zip="55555",
            )
            db.session.add(applicant)
            db.session.commit()

            app_record = DriverApplication(
                user_id=applicant.user_id,
                status=ApplicationStatus.PENDING,
                license_info="DL777888",
            )
            db.session.add(app_record)
            db.session.commit()
            app_id = app_record.driver_application_id

        response = admin_client.put(
            f"/admin/decision/{app_id}",
            json={"new_status": "invalid"},
        )

        assert response.status_code == 400

    def test_change_app_status_not_found(self, admin_client):
        """Changing status of non-existent application returns 404."""
        response = admin_client.put(
            "/admin/decision/999",
            json={"new_status": "approved"},
        )

        assert response.status_code == 404

    def test_change_app_status_not_admin(self, client, test_user, app):
        """Non-admin cannot change application status returns 403."""
        with app.app_context():
            applicant = User(
                first_name="Non",
                last_name="Admin",
                email="nonadmin@example.com",
                password_hash=generate_password_hash("pass"),
                address_street="600 Non St",
                address_city="NonCity",
                address_state="NC",
                address_zip="66666",
            )
            db.session.add(applicant)
            db.session.commit()

            app_record = DriverApplication(
                user_id=applicant.user_id,
                status=ApplicationStatus.PENDING,
                license_info="DL999111",
            )
            db.session.add(app_record)
            db.session.commit()
            app_id = app_record.driver_application_id

        # Login as non-admin
        client.post(
            "/api/login",
            json={
                "email": test_user["email"],
                "password": test_user["password"],
            },
        )

        response = client.put(
            f"/admin/decision/{app_id}",
            json={"new_status": "approved"},
        )

        assert response.status_code == 403
