class TestSignup:
    """Tests for POST /api/signup."""

    def test_signup_success(self, client):
        """Test successful user registration."""
        response = client.post(
            "/api/signup",
            json={
                "first_name": "user",
                "last_name": "test",
                "email": "newuser@example.com",
                "password": "newpassword",
                "address_street": "test",
                "address_state": "test",
                "address_city": "test",
                "address_zip": "test",
            },
        )
        assert response.status_code == 201
        assert response.json["message"] == "new user created successfully"

    def test_signup_missing_first_name(self, client):
        """Test signup with missing first name."""
        response = client.post(
            "/api/signup",
            json={
                "last_name": "test",
                "email": "newuser@example.com",
                "password": "newpassword",
                "address_street": "test",
                "address_city": "test",
                "address_state": "test",
                "address_zip": "000",
            },
        )
        assert response.status_code == 400
        assert "first name required" in response.json["message"]

    def test_signup_missing_last_name(self, client):
        """Test signup with missing last name."""
        response = client.post(
            "/api/signup",
            json={
                "first_name": "test",
                "email": "newuser@example.com",
                "password": "newpassword",
            },
        )
        assert response.status_code == 400
        assert "last name required" in response.json["message"]

    def test_signup_missing_email(self, client):
        """Test signup with missing email."""
        response = client.post(
            "/api/signup",
            json={
                "first_name": "user",
                "last_name": "test",
                "password": "newpassword",
            },
        )
        assert response.status_code == 400
        assert "email and password required" in response.json["message"]

    def test_signup_missing_password(self, client):
        """Test signup with missing password."""
        response = client.post(
            "/api/signup",
            json={
                "first_name": "user",
                "last_name": "test",
                "email": "newuser@example.com",
            },
        )
        assert response.status_code == 400
        assert "email and password required" in response.json["message"]

    def test_signup_missing_address_state(self, client):
        """Test signup with missing address state."""
        response = client.post(
            "/api/signup",
            json={
                "first_name": "user",
                "last_name": "test",
                "email": "newuser@example.com",
                "password": "newpassword",
                "address_street": "test",
                "address_city": "test",
                "address_zip": "000",
            },
        )
        assert response.status_code == 400
        assert (
            "address (street, city, state, zip) required"
            in response.json["message"]
        )

    def test_signup_missing_address_city(self, client):
        """Test signup with missing address city."""
        response = client.post(
            "/api/signup",
            json={
                "first_name": "user",
                "last_name": "test",
                "email": "newuser@example.com",
                "password": "newpassword",
                "address_street": "test",
                "address_state": "test",
                "address_zip": "000",
            },
        )
        assert response.status_code == 400
        assert (
            "address (street, city, state, zip) required"
            in response.json["message"]
        )

    def test_signup_missing_address_zip(self, client):
        """Test signup with missing address zip code."""
        response = client.post(
            "/api/signup",
            json={
                "first_name": "user",
                "last_name": "test",
                "email": "newuser@example.com",
                "password": "newpassword",
                "address_street": "test",
                "address_city": "test",
                "address_state": "test",
            },
        )
        assert response.status_code == 400
        assert (
            "address (street, city, state, zip) required"
            in response.json["message"]
        )

    def test_signup_duplicate_email(self, client, test_user):
        """Test signup with existing email."""
        response = client.post(
            "/api/signup",
            json={
                "first_name": "user",
                "last_name": "test",
                "email": test_user["email"],
                "password": "anotherpassword",
                "address_street": "test",
                "address_city": "test",
                "address_state": "test",
                "address_zip": "000",
            },
        )
        assert response.status_code == 409
        assert "user already exists" in response.json["message"]


class TestLogin:
    """Tests for POST /api/login."""

    def test_login_success(self, client, test_user):
        """Test successful login."""
        response = client.post(
            "/api/login",
            json={
                "email": test_user["email"],
                "password": test_user["password"],
            },
        )
        assert response.status_code == 200
        assert response.json["message"] == "user logged in successfully"

    def test_login_wrong_password(self, client, test_user):
        """Test login with wrong password."""
        response = client.post(
            "/api/login",
            json={"email": test_user["email"], "password": "wrongpassword"},
        )
        assert response.status_code == 401
        assert "wrong password" in response.json["message"]

    def test_login_nonexistent_user(self, client):
        """Test login with non-existent user."""
        response = client.post(
            "/api/login",
            json={"email": "nonexistent@example.com", "password": "password"},
        )
        assert response.status_code == 401
        assert "user not found" in response.json["message"]

    def test_rejects_non_json_content_type(self, client):
        """POST with non-JSON content type returns 415."""
        response = client.post(
            "/api/login",
            data="email=test@example.com&password=test",
            content_type="application/x-www-form-urlencoded",
        )
        assert response.status_code == 415
        assert (
            response.get_json()["message"]
            == "Content-Type must be application/json"
        )


class TestLogout:
    """Tests for POST /api/logout."""

    def test_logout_success(self, auth_client):
        """Test successful logout."""
        response = auth_client.post("/api/logout")
        assert response.status_code == 200
        assert response.json["message"] == "user logout successful"

    def test_logout_unauthorized(self, client):
        """Test logout without being logged in."""
        response = client.post("/api/logout")
        assert response.status_code == 401
