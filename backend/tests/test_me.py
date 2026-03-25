from datetime import datetime, timedelta, timezone

from app.extensions import db
from app.models import DriverApplication, Item, Order, OrderItem, Trip, User
from app.models.enums import (
    ApplicationStatus,
    OrderStatus,
    TripStatus,
    UserRole,
)
from app.services.user_service import (
    get_current_user_profile,
    update_current_user_profile,
)
from werkzeug.security import generate_password_hash


def _make_driver(db_session, email="driver@example.com"):
    """Create and persist a driver user for route tests."""
    driver = User(
        first_name="Driver",
        last_name="Tester",
        email=email,
        password_hash=generate_password_hash("password123"),
        role=UserRole.DRIVER,
        address_street="1 Driver St",
        address_city="SF",
        address_state="CA",
        address_zip="94101",
    )
    db_session.session.add(driver)
    db_session.session.commit()
    return driver


def _make_shopper(db_session, email="shopper@example.com"):
    """Create and persist a shopper user for route tests."""
    shopper = User(
        first_name="Shopper",
        last_name="Tester",
        email=email,
        password_hash=generate_password_hash("password123"),
        role=UserRole.SHOPPER,
        address_street="2 Shopper St",
        address_city="SF",
        address_state="CA",
        address_zip="94102",
    )
    db_session.session.add(shopper)
    db_session.session.commit()
    return shopper


def _login(client, email, password="password123"):
    """Authenticate a user through the public login route."""
    client.post(
        "/api/login",
        json={"email": email, "password": password},
    )


def _make_open_trip_with_item(db_session, driver, available_quantity=4):
    """Create a claimable trip and one item for order route tests."""
    trip = Trip(
        driver_id=driver.user_id,
        store_name="Costco",
        pickup_location_text="123 Main St",
        pickup_time=datetime.now(timezone.utc) + timedelta(days=1),
        pickup_lat=37.7749,
        pickup_lng=-122.4194,
        status=TripStatus.OPEN,
    )
    db_session.session.add(trip)
    db_session.session.flush()

    item = Item(
        trip_id=trip.trip_id,
        name="Paper Towels",
        unit="pack",
        total_quantity=available_quantity,
        claimed_quantity=0,
        price_per_unit=15.99,
    )
    db_session.session.add(item)
    db_session.session.commit()
    return trip, item


class TestGetMeRoute:
    """Tests for GET /api/me."""

    def test_get_me_requires_login(self, client):
        """Unauthenticated requests should return 401."""
        response = client.get("/api/me")

        assert response.status_code == 401
        assert response.json["message"] == "Unauthorized"

    def test_get_me_returns_user_and_latest_application(self, client, app):
        """The route should return the user and most recent application."""
        with app.app_context():
            shopper = _make_shopper(db, email="me@example.com")
            db.session.add(
                DriverApplication(
                    user_id=shopper.user_id,
                    status=ApplicationStatus.REJECTED,
                    license_info="OLD123 | exp 2028-01-01",
                )
            )
            db.session.add(
                DriverApplication(
                    user_id=shopper.user_id,
                    status=ApplicationStatus.PENDING,
                    license_info="NEW123 | exp 2029-01-01",
                )
            )
            db.session.commit()
            _login(client, shopper.email)

        response = client.get("/api/me")

        assert response.status_code == 200
        assert response.json["user"]["email"] == "me@example.com"
        assert response.json["driver_application"]["status"] == "pending"
        assert (
            response.json["driver_application"]["license_info"]
            == "NEW123 | exp 2029-01-01"
        )


class TestUpdateMeRoute:
    """Tests for PUT /api/me."""

    def test_update_me_requires_login(self, client):
        """Unauthenticated profile updates should return 401."""
        response = client.put("/api/me", json={"display_name": "New Name"})

        assert response.status_code == 401

    def test_update_me_success(self, client, app):
        """Authenticated shoppers can update editable profile fields."""
        with app.app_context():
            shopper = _make_shopper(db, email="update@example.com")
            _login(client, shopper.email)

        response = client.put(
            "/api/me",
            json={
                "display_name": "Jae Yo",
                "email": "updated@example.com",
                "address_street": "2550 Van Ness Ave",
                "address_city": "San Francisco",
                "address_state": "CA",
                "address_zip": "94109",
            },
        )

        assert response.status_code == 200
        assert response.json["user"]["full_name"] == "Jae Yo"
        assert response.json["user"]["email"] == "updated@example.com"
        assert response.json["user"]["address_city"] == "San Francisco"

    def test_update_me_rejects_blank_display_name(self, client, app):
        """Blank display names should fail validation."""
        with app.app_context():
            shopper = _make_shopper(db, email="blank-name@example.com")
            _login(client, shopper.email)

        response = client.put(
            "/api/me",
            json={"display_name": "   "},
        )

        assert response.status_code == 400
        assert response.json["message"] == "display_name required"

    def test_update_me_rejects_duplicate_email(self, client, app):
        """Updating to another user's email should return 409."""
        with app.app_context():
            shopper = _make_shopper(db, email="first@example.com")
            _make_shopper(db, email="second@example.com")
            _login(client, shopper.email)

        response = client.put(
            "/api/me",
            json={"email": "second@example.com"},
        )

        assert response.status_code == 409
        assert response.json["message"] == "user already exists"

    def test_update_me_rejects_empty_required_profile_field(self, client, app):
        """Empty required address fields should be rejected."""
        with app.app_context():
            shopper = _make_shopper(db, email="profile-fields@example.com")
            _login(client, shopper.email)

        response = client.put(
            "/api/me",
            json={"address_city": ""},
        )

        assert response.status_code == 400
        assert response.json["message"] == "profile fields cannot be empty"


class TestMyOrdersRoutes:
    """Tests for /api/me/orders routes."""

    def test_list_orders_requires_login(self, client):
        """Unauthenticated order history requests should return 401."""
        response = client.get("/api/me/orders")

        assert response.status_code == 401

    def test_list_orders_returns_only_current_shopper_orders(
        self, client, app
    ):
        """Order history should only include the logged-in shopper's orders."""
        with app.app_context():
            driver = _make_driver(db)
            shopper = _make_shopper(db, email="orders@example.com")
            other_shopper = _make_shopper(db, email="other-orders@example.com")
            trip, item = _make_open_trip_with_item(db, driver)
            shopper_id = shopper.user_id
            driver_name = driver.full_name

            first_order = Order(
                shopper_id=shopper.user_id, trip_id=trip.trip_id
            )
            second_order = Order(
                shopper_id=other_shopper.user_id, trip_id=trip.trip_id
            )
            db.session.add_all([first_order, second_order])
            db.session.flush()
            db.session.add(
                OrderItem(
                    order_id=first_order.order_id,
                    item_id=item.item_id,
                    quantity=1,
                )
            )
            db.session.commit()
            _login(client, shopper.email)

        response = client.get("/api/me/orders")

        assert response.status_code == 200
        assert len(response.json["orders"]) == 1
        assert response.json["orders"][0]["shopper_id"] == shopper_id
        assert response.json["orders"][0]["trip"]["driver"]["full_name"] == (
            driver_name
        )

    def test_create_order_success(self, client, app):
        """A shopper can create an order against an open trip."""
        with app.app_context():
            driver = _make_driver(db)
            shopper = _make_shopper(db, email="checkout@example.com")
            trip, item = _make_open_trip_with_item(db, driver)
            shopper_id = shopper.user_id
            trip_id = trip.trip_id
            item_id = item.item_id
            _login(client, shopper.email)

        response = client.post(
            "/api/me/orders",
            json={
                "trip_id": trip_id,
                "items": [{"item_id": item_id, "quantity": 2}],
            },
        )

        assert response.status_code == 201
        assert response.json["order"]["status"] == "claimed"
        assert len(response.json["order"]["order_items"]) == 1

        with app.app_context():
            created_order = Order.query.one()
            updated_item = db.session.get(Item, item_id)
            assert created_order.shopper_id == shopper_id
            assert updated_item.claimed_quantity == 2

    def test_create_order_requires_trip_and_items(self, auth_client):
        """Checkout should fail when trip_id or items are missing."""
        response = auth_client.post("/api/me/orders", json={})

        assert response.status_code == 400
        assert response.json["message"] == "trip_id and items are required"

    def test_create_order_rejects_missing_trip(self, auth_client):
        """Orders against unknown trips should return 404."""
        response = auth_client.post(
            "/api/me/orders",
            json={"trip_id": 9999, "items": [{"item_id": 1, "quantity": 1}]},
        )

        assert response.status_code == 404
        assert response.json["message"] == "Trip not found"

    def test_create_order_rejects_closed_trip(self, client, app):
        """Shoppers cannot place orders on trips that are no longer open."""
        with app.app_context():
            driver = _make_driver(db)
            shopper = _make_shopper(db, email="closed-trip@example.com")
            trip, item = _make_open_trip_with_item(db, driver)
            trip.status = TripStatus.CLOSED
            db.session.commit()
            trip_id = trip.trip_id
            item_id = item.item_id
            _login(client, shopper.email)

        response = client.post(
            "/api/me/orders",
            json={
                "trip_id": trip_id,
                "items": [{"item_id": item_id, "quantity": 1}],
            },
        )

        assert response.status_code == 409
        assert response.json["message"] == "Trip is not accepting claims"

    def test_create_order_rejects_missing_item_fields(self, client, app):
        """Each claimed item must include both item_id and quantity."""
        with app.app_context():
            driver = _make_driver(db)
            shopper = _make_shopper(db, email="missing-item@example.com")
            trip, _ = _make_open_trip_with_item(db, driver)
            trip_id = trip.trip_id
            _login(client, shopper.email)

        response = client.post(
            "/api/me/orders",
            json={"trip_id": trip_id, "items": [{"item_id": 1}]},
        )

        assert response.status_code == 400
        assert (
            response.json["message"]
            == "Each claimed item requires item_id and quantity"
        )

    def test_create_order_rejects_non_integer_quantity(self, client, app):
        """Item quantities must be parseable integers."""
        with app.app_context():
            driver = _make_driver(db)
            shopper = _make_shopper(db, email="bad-quantity@example.com")
            trip, item = _make_open_trip_with_item(db, driver)
            trip_id = trip.trip_id
            item_id = item.item_id
            _login(client, shopper.email)

        response = client.post(
            "/api/me/orders",
            json={
                "trip_id": trip_id,
                "items": [{"item_id": item_id, "quantity": "two"}],
            },
        )

        assert response.status_code == 400
        assert response.json["message"] == "quantity must be an integer"

    def test_create_order_rejects_non_positive_quantity(self, client, app):
        """Item quantities must be greater than zero."""
        with app.app_context():
            driver = _make_driver(db)
            shopper = _make_shopper(db, email="zero-quantity@example.com")
            trip, item = _make_open_trip_with_item(db, driver)
            trip_id = trip.trip_id
            item_id = item.item_id
            _login(client, shopper.email)

        response = client.post(
            "/api/me/orders",
            json={
                "trip_id": trip_id,
                "items": [{"item_id": item_id, "quantity": 0}],
            },
        )

        assert response.status_code == 400
        assert response.json["message"] == "quantity must be greater than zero"

    def test_create_order_rejects_item_on_other_trip(self, client, app):
        """Claimed items must belong to the selected trip."""
        with app.app_context():
            driver = _make_driver(db)
            shopper = _make_shopper(db, email="wrong-trip-item@example.com")
            trip, _ = _make_open_trip_with_item(db, driver)
            other_trip, other_item = _make_open_trip_with_item(
                db, driver, available_quantity=2
            )
            trip_id = trip.trip_id
            other_trip_id = other_trip.trip_id
            other_item_id = other_item.item_id
            _login(client, shopper.email)

        response = client.post(
            "/api/me/orders",
            json={
                "trip_id": trip_id,
                "items": [{"item_id": other_item_id, "quantity": 1}],
            },
        )

        assert other_trip_id != trip_id
        assert response.status_code == 400
        assert response.json["message"] == "Item does not belong to this trip"

    def test_create_order_rejects_oversell(self, client, app):
        """Claims above available inventory should return 409."""
        with app.app_context():
            driver = _make_driver(db)
            shopper = _make_shopper(db, email="oversell@example.com")
            trip, item = _make_open_trip_with_item(
                db, driver, available_quantity=1
            )
            trip_id = trip.trip_id
            item_id = item.item_id
            _login(client, shopper.email)

        response = client.post(
            "/api/me/orders",
            json={
                "trip_id": trip_id,
                "items": [{"item_id": item_id, "quantity": 2}],
            },
        )

        assert response.status_code == 409
        assert "Not enough quantity available" in response.json["message"]

    def test_complete_order_success(self, client, app):
        """A shopper can mark one of their own orders as completed."""
        with app.app_context():
            driver = _make_driver(db)
            shopper = _make_shopper(db, email="complete@example.com")
            trip, _ = _make_open_trip_with_item(db, driver)
            order = Order(shopper_id=shopper.user_id, trip_id=trip.trip_id)
            db.session.add(order)
            db.session.commit()
            order_id = order.order_id
            _login(client, shopper.email)

        response = client.patch(f"/api/me/orders/{order_id}/complete")

        assert response.status_code == 200
        assert response.json["order"]["status"] == "completed"

    def test_complete_order_requires_login(self, client):
        """Unauthenticated completion requests should return 401."""
        response = client.patch("/api/me/orders/1/complete")

        assert response.status_code == 401

    def test_complete_order_rejects_missing_order(self, auth_client):
        """Completing an unknown order should return 404."""
        response = auth_client.patch("/api/me/orders/9999/complete")

        assert response.status_code == 404
        assert response.json["message"] == "Order not found"

    def test_complete_order_rejects_other_shopper(self, client, app):
        """Shoppers cannot complete orders that belong to other users."""
        with app.app_context():
            driver = _make_driver(db)
            shopper = _make_shopper(db, email="owner@example.com")
            other_shopper = _make_shopper(db, email="other-owner@example.com")
            trip, _ = _make_open_trip_with_item(db, driver)
            order = Order(shopper_id=shopper.user_id, trip_id=trip.trip_id)
            db.session.add(order)
            db.session.commit()
            order_id = order.order_id
            _login(client, other_shopper.email)

        response = client.patch(f"/api/me/orders/{order_id}/complete")

        assert response.status_code == 403
        assert (
            response.json["message"] == "You can only update your own orders"
        )

    def test_complete_order_rejects_cancelled_order(self, client, app):
        """Cancelled orders cannot transition to completed."""
        with app.app_context():
            driver = _make_driver(db)
            shopper = _make_shopper(db, email="cancelled@example.com")
            trip, _ = _make_open_trip_with_item(db, driver)
            order = Order(
                shopper_id=shopper.user_id,
                trip_id=trip.trip_id,
                status=OrderStatus.CANCELLED,
            )
            db.session.add(order)
            db.session.commit()
            order_id = order.order_id
            _login(client, shopper.email)

        response = client.patch(f"/api/me/orders/{order_id}/complete")

        assert response.status_code == 409
        assert response.json["message"] == "Cannot complete a cancelled order"

    def test_complete_order_is_idempotent_for_completed_order(
        self, client, app
    ):
        """Completing an already completed order should remain a no-op."""
        with app.app_context():
            driver = _make_driver(db)
            shopper = _make_shopper(db, email="completed@example.com")
            trip, _ = _make_open_trip_with_item(db, driver)
            order = Order(
                shopper_id=shopper.user_id,
                trip_id=trip.trip_id,
                status=OrderStatus.COMPLETED,
            )
            db.session.add(order)
            db.session.commit()
            order_id = order.order_id
            _login(client, shopper.email)

        response = client.patch(f"/api/me/orders/{order_id}/complete")

        assert response.status_code == 200
        assert response.json["order"]["status"] == "completed"


class TestUserService:
    """Direct service tests for branches not reachable through routes."""

    def test_get_current_user_profile_rejects_missing_user(self, app):
        """Missing users should return a 404 tuple from the service."""
        with app.app_context():
            payload, error, status = get_current_user_profile(9999)

        assert payload is None
        assert error == "User not found"
        assert status == 404

    def test_update_current_user_profile_rejects_missing_user(self, app):
        """Profile updates for missing users should return a 404 tuple."""
        with app.app_context():
            payload, error, status = update_current_user_profile(9999, {})

        assert payload is None
        assert error == "User not found"
        assert status == 404
