import pytest
from app import create_app
from app.extensions import db
from app.models import User
from werkzeug.security import generate_password_hash


@pytest.fixture
def app():
    """Create and configure a new app instance for each test."""
    app = create_app(
        {
            "TESTING": True,
            "SQLALCHEMY_DATABASE_URI": "sqlite:///:memory:",
            "WTF_CSRF_ENABLED": False,
            "LOGIN_DISABLED": False,
        }
    )

    with app.app_context():
        db.create_all()
        yield app
        db.drop_all()


@pytest.fixture
def client(app):
    """A test client for the app."""
    return app.test_client()


@pytest.fixture
def runner(app):
    """A test runner for the app's Click commands."""
    return app.test_cli_runner()


@pytest.fixture
def test_user(app):
    """Create a test user."""
    with app.app_context():
        user = User(
            first_name="user",
            last_name="test",
            email="test@example.com",
            password_hash=generate_password_hash("password123"),
            address_street="1 test st",
            address_city="test metro",
            address_state="testing",
            address_zip="000",
        )
        db.session.add(user)
        db.session.commit()
        return {
            "user_id": user.id,
            "email": user.email,
            "password": "password123",
        }


@pytest.fixture
def auth_client(client, test_user):
    """A test client that is already logged in."""
    client.post(
        "/api/login",
        json={"email": test_user["email"], "password": test_user["password"]},
    )
    return client
