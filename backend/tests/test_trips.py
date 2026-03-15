from datetime import datetime, timezone, timedelta

from app.extensions import db
from app.models import User, Trip, Item, Order
from app.models.enums import (
    UserRole,
    TripStatus,
    OrderStatus,
)
from werkzeug.security import generate_password_hash


def _make_driver(db_session):
    """Create and return a driver user."""
    driver = User(
        first_name="Driver",
        last_name="Test",
        email="driver@example.com",
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


def _make_shopper(db_session):
    """Create and return a shopper user."""
    shopper = User(
        first_name="Shopper",
        last_name="Test",
        email="shopper@example.com",
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
    """Log in a user via the auth route."""
    client.post(
        "/api/login",
        json={"email": email, "password": password},
    )


def _trip_payload():
    """Return a valid trip creation payload."""
    return {
        "store_name": "Costco",
        "pickup_location_text": "123 Main St, SF",
        "pickup_lat": 37.7749,
        "pickup_lng": -122.4194,
        "pickup_time": (
            datetime.now(timezone.utc) + timedelta(days=1)
        ).isoformat(),
        "items": [
            {
                "name": "Paper Towels 12-pack",
                "unit": "pack",
                "total_quantity": 10,
                "price_per_unit": 15.99,
            },
            {
                "name": "Olive Oil 2L",
                "unit": "bottle",
                "total_quantity": 5,
                "price_per_unit": 12.50,
            },
        ],
    }


# ── Create Trip ──────────────────────────────────────────────


class TestCreateTrip:
    """Tests for POST /api/trips."""

    def test_driver_can_create_trip_with_items(self, client, app):
        """Driver creates a trip and items are persisted."""
        with app.app_context():
            driver = _make_driver(db)
            _login(client, driver.email)

        response = client.post("/api/trips", json=_trip_payload())

        assert response.status_code == 201
        assert "trip" in response.json

        with app.app_context():
            trip = Trip.query.one()
            assert trip.store_name == "Costco"
            assert trip.status == TripStatus.OPEN
            assert trip.items.count() == 2

    def test_shopper_cannot_create_trip(self, client, app):
        """Shoppers should be rejected from creating trips."""
        with app.app_context():
            shopper = _make_shopper(db)
            _login(client, shopper.email)

        response = client.post("/api/trips", json=_trip_payload())

        assert response.status_code == 403

    def test_unauthenticated_cannot_create_trip(self, client):
        """Unauthenticated users should receive 401."""
        response = client.post("/api/trips", json=_trip_payload())

        assert response.status_code == 401

    def test_missing_required_fields_rejected(self, client, app):
        """Trips missing required fields should be rejected."""
        with app.app_context():
            driver = _make_driver(db)
            _login(client, driver.email)

        response = client.post("/api/trips", json={})

        assert response.status_code == 400


# ── List / Get Trips ─────────────────────────────────────────


class TestListTrips:
    """Tests for GET /api/trips and GET /api/trips/<id>."""

    def test_list_returns_only_open_trips(self, client, app):
        """Trip feed should only show OPEN trips."""
        with app.app_context():
            driver = _make_driver(db)
            pickup = datetime.now(timezone.utc) + timedelta(days=1)
            open_trip = Trip(
                driver_id=driver.user_id,
                store_name="Costco",
                pickup_location_text="123 Main St",
                pickup_time=pickup,
                status=TripStatus.OPEN,
            )
            closed_trip = Trip(
                driver_id=driver.user_id,
                store_name="Sam's Club",
                pickup_location_text="456 Oak Ave",
                pickup_time=pickup,
                status=TripStatus.CLOSED,
            )
            db.session.add_all([open_trip, closed_trip])
            db.session.commit()
            _login(client, driver.email)

        response = client.get("/api/trips")

        assert response.status_code == 200
        assert len(response.json["trips"]) == 1
        assert response.json["trips"][0]["store_name"] == "Costco"

    def test_get_trip_with_items(self, client, app):
        """GET /api/trips/<id> returns the trip and its items."""
        with app.app_context():
            driver = _make_driver(db)
            trip = Trip(
                driver_id=driver.user_id,
                store_name="Costco",
                pickup_location_text="123 Main St",
                pickup_time=datetime.now(timezone.utc) + timedelta(days=1),
                status=TripStatus.OPEN,
            )
            db.session.add(trip)
            db.session.flush()
            item = Item(
                trip_id=trip.trip_id,
                name="Paper Towels",
                unit="pack",
                total_quantity=10,
            )
            db.session.add(item)
            db.session.commit()
            trip_id = trip.trip_id
            _login(client, driver.email)

        response = client.get(f"/api/trips/{trip_id}")

        assert response.status_code == 200
        assert response.json["trip"]["store_name"] == "Costco"
        assert len(response.json["trip"]["items"]) == 1

    def test_get_nonexistent_trip_returns_404(self, client, app):
        """Requesting a trip that doesn't exist returns 404."""
        with app.app_context():
            driver = _make_driver(db)
            _login(client, driver.email)

        response = client.get("/api/trips/9999")

        assert response.status_code == 404


class TestMyTrips:
    """Tests for GET /api/me/trips."""

    def test_driver_sees_all_own_trips(self, client, app):
        """Driver should see their trips across all statuses."""
        with app.app_context():
            driver = _make_driver(db)
            pickup = datetime.now(timezone.utc) + timedelta(days=1)
            for status in [
                TripStatus.OPEN,
                TripStatus.CLOSED,
                TripStatus.COMPLETED,
            ]:
                db.session.add(
                    Trip(
                        driver_id=driver.user_id,
                        store_name="Store",
                        pickup_location_text="Addr",
                        pickup_time=pickup,
                        status=status,
                    )
                )
            db.session.commit()
            _login(client, driver.email)

        response = client.get("/api/me/trips")

        assert response.status_code == 200
        assert len(response.json["trips"]) == 3


# ── Edit Trip ────────────────────────────────────────────────


class TestEditTrip:
    """Tests for PUT /api/trips/<id>."""

    def test_driver_can_update_own_open_trip(self, client, app):
        """Driver can edit their OPEN trip details."""
        with app.app_context():
            driver = _make_driver(db)
            trip = Trip(
                driver_id=driver.user_id,
                store_name="Costco",
                pickup_location_text="123 Main St",
                pickup_time=datetime.now(timezone.utc) + timedelta(days=1),
            )
            db.session.add(trip)
            db.session.commit()
            trip_id = trip.trip_id
            _login(client, driver.email)

        response = client.put(
            f"/api/trips/{trip_id}",
            json={"store_name": "Sam's Club"},
        )

        assert response.status_code == 200

        with app.app_context():
            updated = db.session.get(Trip, trip_id)
            assert updated.store_name == "Sam's Club"

    def test_cannot_edit_other_drivers_trip(self, client, app):
        """Drivers cannot edit trips they don't own."""
        with app.app_context():
            driver1 = _make_driver(db)
            driver2 = User(
                first_name="Other",
                last_name="Driver",
                email="driver2@example.com",
                password_hash=generate_password_hash("password123"),
                role=UserRole.DRIVER,
                address_street="3 Other St",
                address_city="SF",
                address_state="CA",
                address_zip="94103",
            )
            db.session.add(driver2)
            db.session.commit()
            trip = Trip(
                driver_id=driver1.user_id,
                store_name="Costco",
                pickup_location_text="123 Main St",
                pickup_time=datetime.now(timezone.utc) + timedelta(days=1),
            )
            db.session.add(trip)
            db.session.commit()
            trip_id = trip.trip_id
            _login(client, driver2.email)

        response = client.put(
            f"/api/trips/{trip_id}",
            json={"store_name": "Sam's Club"},
        )

        assert response.status_code == 403

    def test_cannot_edit_closed_trip(self, client, app):
        """Trips that aren't OPEN cannot be edited."""
        with app.app_context():
            driver = _make_driver(db)
            trip = Trip(
                driver_id=driver.user_id,
                store_name="Costco",
                pickup_location_text="123 Main St",
                pickup_time=datetime.now(timezone.utc) + timedelta(days=1),
                status=TripStatus.CLOSED,
            )
            db.session.add(trip)
            db.session.commit()
            trip_id = trip.trip_id
            _login(client, driver.email)

        response = client.put(
            f"/api/trips/{trip_id}",
            json={"store_name": "Sam's Club"},
        )

        assert response.status_code == 409

    def test_cannot_reduce_quantity_below_claimed(self, client, app):
        """Cannot decrease total_quantity below claimed_quantity."""
        with app.app_context():
            driver = _make_driver(db)
            trip = Trip(
                driver_id=driver.user_id,
                store_name="Costco",
                pickup_location_text="123 Main St",
                pickup_time=datetime.now(timezone.utc) + timedelta(days=1),
            )
            db.session.add(trip)
            db.session.flush()
            item = Item(
                trip_id=trip.trip_id,
                name="Paper Towels",
                unit="pack",
                total_quantity=10,
                claimed_quantity=6,
            )
            db.session.add(item)
            db.session.commit()
            trip_id = trip.trip_id
            item_id = item.item_id
            _login(client, driver.email)

        response = client.put(
            f"/api/trips/{trip_id}",
            json={
                "items": [
                    {
                        "item_id": item_id,
                        "total_quantity": 4,
                    }
                ]
            },
        )

        assert response.status_code == 409


# ── Status Transitions ───────────────────────────────────────


class TestCloseTrip:
    """Tests for PATCH /api/trips/<id>/close."""

    def test_close_open_trip(self, client, app):
        """Driver can close an OPEN trip."""
        with app.app_context():
            driver = _make_driver(db)
            trip = Trip(
                driver_id=driver.user_id,
                store_name="Costco",
                pickup_location_text="123 Main St",
                pickup_time=datetime.now(timezone.utc) + timedelta(days=1),
            )
            db.session.add(trip)
            db.session.commit()
            trip_id = trip.trip_id
            _login(client, driver.email)

        response = client.patch(f"/api/trips/{trip_id}/close")

        assert response.status_code == 200

        with app.app_context():
            trip = db.session.get(Trip, trip_id)
            assert trip.status == TripStatus.CLOSED

    def test_cannot_close_already_closed_trip(self, client, app):
        """Closing an already CLOSED trip should fail."""
        with app.app_context():
            driver = _make_driver(db)
            trip = Trip(
                driver_id=driver.user_id,
                store_name="Costco",
                pickup_location_text="123 Main St",
                pickup_time=datetime.now(timezone.utc) + timedelta(days=1),
                status=TripStatus.CLOSED,
            )
            db.session.add(trip)
            db.session.commit()
            trip_id = trip.trip_id
            _login(client, driver.email)

        response = client.patch(f"/api/trips/{trip_id}/close")

        assert response.status_code == 409


class TestCompleteTrip:
    """Tests for PATCH /api/trips/<id>/complete."""

    def test_complete_closed_trip(self, client, app):
        """Driver can complete a CLOSED trip."""
        with app.app_context():
            driver = _make_driver(db)
            trip = Trip(
                driver_id=driver.user_id,
                store_name="Costco",
                pickup_location_text="123 Main St",
                pickup_time=datetime.now(timezone.utc) + timedelta(days=1),
                status=TripStatus.CLOSED,
            )
            db.session.add(trip)
            db.session.commit()
            trip_id = trip.trip_id
            _login(client, driver.email)

        response = client.patch(f"/api/trips/{trip_id}/complete")

        assert response.status_code == 200

        with app.app_context():
            trip = db.session.get(Trip, trip_id)
            assert trip.status == TripStatus.COMPLETED

    def test_cannot_complete_open_trip(self, client, app):
        """Cannot skip CLOSED and go directly OPEN -> COMPLETED."""
        with app.app_context():
            driver = _make_driver(db)
            trip = Trip(
                driver_id=driver.user_id,
                store_name="Costco",
                pickup_location_text="123 Main St",
                pickup_time=datetime.now(timezone.utc) + timedelta(days=1),
                status=TripStatus.OPEN,
            )
            db.session.add(trip)
            db.session.commit()
            trip_id = trip.trip_id
            _login(client, driver.email)

        response = client.patch(f"/api/trips/{trip_id}/complete")

        assert response.status_code == 409


class TestCancelTrip:
    """Tests for PATCH /api/trips/<id>/cancel."""

    def test_cancel_open_trip_cascades_orders(self, client, app):
        """Cancelling an OPEN trip sets its orders to CANCELLED."""
        with app.app_context():
            driver = _make_driver(db)
            shopper = _make_shopper(db)
            trip = Trip(
                driver_id=driver.user_id,
                store_name="Costco",
                pickup_location_text="123 Main St",
                pickup_time=datetime.now(timezone.utc) + timedelta(days=1),
            )
            db.session.add(trip)
            db.session.flush()
            order = Order(
                shopper_id=shopper.user_id,
                trip_id=trip.trip_id,
            )
            db.session.add(order)
            db.session.commit()
            trip_id = trip.trip_id
            order_id = order.order_id
            _login(client, driver.email)

        response = client.patch(f"/api/trips/{trip_id}/cancel")

        assert response.status_code == 200

        with app.app_context():
            trip = db.session.get(Trip, trip_id)
            assert trip.status == TripStatus.CANCELLED
            order = db.session.get(Order, order_id)
            assert order.status == OrderStatus.CANCELLED

    def test_cancel_closed_trip_cascades_orders(self, client, app):
        """Cancelling a CLOSED trip also cascades to orders."""
        with app.app_context():
            driver = _make_driver(db)
            shopper = _make_shopper(db)
            trip = Trip(
                driver_id=driver.user_id,
                store_name="Costco",
                pickup_location_text="123 Main St",
                pickup_time=datetime.now(timezone.utc) + timedelta(days=1),
                status=TripStatus.CLOSED,
            )
            db.session.add(trip)
            db.session.flush()
            order = Order(
                shopper_id=shopper.user_id,
                trip_id=trip.trip_id,
                status=OrderStatus.PURCHASED,
            )
            db.session.add(order)
            db.session.commit()
            trip_id = trip.trip_id
            order_id = order.order_id
            _login(client, driver.email)

        response = client.patch(f"/api/trips/{trip_id}/cancel")

        assert response.status_code == 200

        with app.app_context():
            order = db.session.get(Order, order_id)
            assert order.status == OrderStatus.CANCELLED

    def test_cannot_cancel_completed_trip(self, client, app):
        """Completed trips cannot be cancelled."""
        with app.app_context():
            driver = _make_driver(db)
            trip = Trip(
                driver_id=driver.user_id,
                store_name="Costco",
                pickup_location_text="123 Main St",
                pickup_time=datetime.now(timezone.utc) + timedelta(days=1),
                status=TripStatus.COMPLETED,
            )
            db.session.add(trip)
            db.session.commit()
            trip_id = trip.trip_id
            _login(client, driver.email)

        response = client.patch(f"/api/trips/{trip_id}/cancel")

        assert response.status_code == 409
