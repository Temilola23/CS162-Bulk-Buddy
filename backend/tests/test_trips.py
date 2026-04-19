from datetime import datetime, timezone, timedelta

from app.extensions import db
from app.models import User, Trip, Item, Order, OrderItem
from app.models.enums import (
    UserRole,
    TripStatus,
    OrderStatus,
)
from werkzeug.security import generate_password_hash


def _make_driver(db_session, email="driver@example.com"):
    """
    Create and return a persisted driver user.

    Args:
        db_session: The SQLAlchemy database instance used
            to add and commit the new user.

    Returns:
        User: A committed User with role DRIVER.
    """
    driver = User(
        first_name="Driver",
        last_name="Test",
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
    """
    Create and return a persisted shopper user.

    Args:
        db_session: The SQLAlchemy database instance used
            to add and commit the new user.

    Returns:
        User: A committed User with role SHOPPER.
    """
    shopper = User(
        first_name="Shopper",
        last_name="Test",
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
    """
    Log in a user via the auth endpoint.

    Args:
        client: The Flask test client.
        email (str): The user's email address.
        password (str): The user's password.  Defaults to
            ``"password123"``.
    """
    client.post(
        "/api/login",
        json={"email": email, "password": password},
    )


def _trip_payload():
    """
    Return a valid trip creation payload.

    Returns:
        dict: A JSON-serializable dictionary with all
            required fields for ``POST /api/me/trips``.
    """
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
    """Tests for POST /api/me/trips."""

    def test_driver_can_create_trip_with_items(self, client, app):
        """Driver creates a trip and items are persisted."""
        with app.app_context():
            driver = _make_driver(db)
            _login(client, driver.email)

        response = client.post("/api/me/trips", json=_trip_payload())

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

        response = client.post("/api/me/trips", json=_trip_payload())

        assert response.status_code == 403

    def test_unauthenticated_cannot_create_trip(self, client):
        """Unauthenticated users should receive 401."""
        response = client.post("/api/me/trips", json=_trip_payload())

        assert response.status_code == 401

    def test_missing_required_fields_rejected(self, client, app):
        """Trips missing required fields should be rejected."""
        with app.app_context():
            driver = _make_driver(db)
            _login(client, driver.email)

        response = client.post("/api/me/trips", json={})

        assert response.status_code == 400

    def test_invalid_pickup_time_rejected(self, client, app):
        """Invalid pickup_time returns 400, not 500."""
        with app.app_context():
            driver = _make_driver(db)
            _login(client, driver.email)

        payload = _trip_payload()
        payload["pickup_time"] = "not-a-datetime"
        response = client.post("/api/me/trips", json=payload)

        assert response.status_code == 400
        assert "ISO 8601" in response.json["message"]

    def test_item_missing_required_fields_rejected(self, client, app):
        """Items missing name, unit, or total_quantity return 400."""
        with app.app_context():
            driver = _make_driver(db)
            _login(client, driver.email)

        payload = _trip_payload()
        payload["items"] = [{"name": "Paper Towels"}]
        response = client.post("/api/me/trips", json=payload)

        assert response.status_code == 400
        assert "unit" in response.json["message"]
        assert "total_quantity" in response.json["message"]


# ── List / Get Trips ─────────────────────────────────────────


class TestListTrips:
    """Tests for GET /api/trips and GET /api/trips/<id>."""

    def test_list_returns_only_open_trips(self, client, app):
        """Trip feed should only show OPEN trips."""
        with app.app_context():
            driver = _make_driver(db)
            shopper = _make_shopper(db)
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
            _login(client, shopper.email)

        response = client.get("/api/trips")

        assert response.status_code == 200
        assert len(response.json["trips"]) == 1
        assert response.json["trips"][0]["store_name"] == "Costco"

    def test_list_hides_current_drivers_own_trips(self, client, app):
        """Drivers should not see their own trips in the shopper feed."""
        with app.app_context():
            driver = _make_driver(db)
            other_driver = User(
                first_name="Other",
                last_name="Driver",
                email="other-driver@example.com",
                password_hash=generate_password_hash("password123"),
                role=UserRole.DRIVER,
                address_street="3 Driver St",
                address_city="SF",
                address_state="CA",
                address_zip="94103",
            )
            db.session.add(other_driver)
            db.session.commit()

            pickup = datetime.now(timezone.utc) + timedelta(days=1)
            own_trip = Trip(
                driver_id=driver.user_id,
                store_name="Own Costco",
                pickup_location_text="123 Main St",
                pickup_time=pickup,
                status=TripStatus.OPEN,
            )
            other_trip = Trip(
                driver_id=other_driver.user_id,
                store_name="Other Costco",
                pickup_location_text="456 Oak Ave",
                pickup_time=pickup,
                status=TripStatus.OPEN,
            )
            db.session.add_all([own_trip, other_trip])
            db.session.commit()
            _login(client, driver.email)

        response = client.get("/api/trips")

        assert response.status_code == 200
        assert len(response.json["trips"]) == 1
        assert response.json["trips"][0]["store_name"] == "Other Costco"

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
    """Tests for PUT /api/me/trips/<id>."""

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
            f"/api/me/trips/{trip_id}",
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
            f"/api/me/trips/{trip_id}",
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
            f"/api/me/trips/{trip_id}",
            json={"store_name": "Sam's Club"},
        )

        assert response.status_code == 409

    def test_invalid_pickup_time_on_update_rejected(self, client, app):
        """Invalid pickup_time on update returns 400."""
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
            f"/api/me/trips/{trip_id}",
            json={"pickup_time": "bad-datetime"},
        )

        assert response.status_code == 400
        assert "ISO 8601" in response.json["message"]

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
            f"/api/me/trips/{trip_id}",
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
    """Tests for PATCH /api/me/trips/<id>/close."""

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

        response = client.patch(f"/api/me/trips/{trip_id}/close")

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

        response = client.patch(f"/api/me/trips/{trip_id}/close")

        assert response.status_code == 409


class TestCompleteTrip:
    """Tests for PATCH /api/me/trips/<id>/complete."""

    def test_complete_ready_for_pickup_trip(self, client, app):
        """Driver can complete a READY_FOR_PICKUP trip."""
        with app.app_context():
            driver = _make_driver(db)
            trip = Trip(
                driver_id=driver.user_id,
                store_name="Costco",
                pickup_location_text="123 Main St",
                pickup_time=datetime.now(timezone.utc) + timedelta(days=1),
                status=TripStatus.READY_FOR_PICKUP,
            )
            db.session.add(trip)
            db.session.commit()
            trip_id = trip.trip_id
            _login(client, driver.email)

        response = client.patch(f"/api/me/trips/{trip_id}/complete")

        assert response.status_code == 200

        with app.app_context():
            trip = db.session.get(Trip, trip_id)
            assert trip.status == TripStatus.COMPLETED

    def test_cannot_complete_open_trip(self, client, app):
        """Cannot skip directly from OPEN to COMPLETED."""
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

        response = client.patch(f"/api/me/trips/{trip_id}/complete")

        assert response.status_code == 409


class TestPurchaseTrip:
    """Tests for PATCH /api/me/trips/<id>/purchase."""

    def test_purchase_closed_trip_cascades_orders(self, client, app):
        """Marking a trip purchased cascades claimed orders only."""
        with app.app_context():
            driver = _make_driver(db)
            shopper = _make_shopper(db)
            cancelled_shopper = _make_shopper(
                db, email="cancelled-purchase@example.com"
            )
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
            )
            cancelled_order = Order(
                shopper_id=cancelled_shopper.user_id,
                trip_id=trip.trip_id,
                status=OrderStatus.CANCELLED,
            )
            db.session.add_all([order, cancelled_order])
            db.session.commit()
            trip_id = trip.trip_id
            order_id = order.order_id
            cancelled_order_id = cancelled_order.order_id
            _login(client, driver.email)

        response = client.patch(f"/api/me/trips/{trip_id}/purchase")

        assert response.status_code == 200

        with app.app_context():
            trip = db.session.get(Trip, trip_id)
            order = db.session.get(Order, order_id)
            cancelled_order = db.session.get(Order, cancelled_order_id)
            assert trip.status == TripStatus.PURCHASED
            assert order.status == OrderStatus.PURCHASED
            assert cancelled_order.status == OrderStatus.CANCELLED

    def test_cannot_purchase_open_trip(self, client, app):
        """Trips must be closed before the driver can mark them purchased."""
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

        response = client.patch(f"/api/me/trips/{trip_id}/purchase")

        assert response.status_code == 409

    def test_cannot_purchase_other_drivers_trip(self, client, app):
        """Drivers cannot mark another driver's trip as purchased."""
        with app.app_context():
            driver = _make_driver(db)
            other_driver = _make_driver(db, email="other-driver@example.com")
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
            _login(client, other_driver.email)

        response = client.patch(f"/api/me/trips/{trip_id}/purchase")

        assert response.status_code == 403

        with app.app_context():
            trip = db.session.get(Trip, trip_id)
            assert trip.status == TripStatus.CLOSED


class TestReadyForPickupTrip:
    """Tests for PATCH /api/me/trips/<id>/ready-for-pickup."""

    def test_ready_for_pickup_cascades_orders(self, client, app):
        """Marking a trip ready for pickup cascades purchased orders only."""
        with app.app_context():
            driver = _make_driver(db)
            shopper = _make_shopper(db)
            cancelled_shopper = _make_shopper(
                db, email="cancelled-ready@example.com"
            )
            trip = Trip(
                driver_id=driver.user_id,
                store_name="Costco",
                pickup_location_text="123 Main St",
                pickup_time=datetime.now(timezone.utc) + timedelta(days=1),
                status=TripStatus.PURCHASED,
            )
            db.session.add(trip)
            db.session.flush()
            order = Order(
                shopper_id=shopper.user_id,
                trip_id=trip.trip_id,
                status=OrderStatus.PURCHASED,
            )
            cancelled_order = Order(
                shopper_id=cancelled_shopper.user_id,
                trip_id=trip.trip_id,
                status=OrderStatus.CANCELLED,
            )
            db.session.add_all([order, cancelled_order])
            db.session.commit()
            trip_id = trip.trip_id
            order_id = order.order_id
            cancelled_order_id = cancelled_order.order_id
            _login(client, driver.email)

        response = client.patch(f"/api/me/trips/{trip_id}/ready-for-pickup")

        assert response.status_code == 200

        with app.app_context():
            trip = db.session.get(Trip, trip_id)
            order = db.session.get(Order, order_id)
            cancelled_order = db.session.get(Order, cancelled_order_id)
            assert trip.status == TripStatus.READY_FOR_PICKUP
            assert order.status == OrderStatus.READY_FOR_PICKUP
            assert cancelled_order.status == OrderStatus.CANCELLED

    def test_cannot_ready_for_pickup_before_purchase(self, client, app):
        """Trips must be purchased before they are ready for pickup."""
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

        response = client.patch(f"/api/me/trips/{trip_id}/ready-for-pickup")

        assert response.status_code == 409

    def test_cannot_ready_for_pickup_other_drivers_trip(self, client, app):
        """Drivers cannot mark another driver's trip ready for pickup."""
        with app.app_context():
            driver = _make_driver(db)
            other_driver = _make_driver(db, email="other-driver@example.com")
            trip = Trip(
                driver_id=driver.user_id,
                store_name="Costco",
                pickup_location_text="123 Main St",
                pickup_time=datetime.now(timezone.utc) + timedelta(days=1),
                status=TripStatus.PURCHASED,
            )
            db.session.add(trip)
            db.session.commit()
            trip_id = trip.trip_id
            _login(client, other_driver.email)

        response = client.patch(f"/api/me/trips/{trip_id}/ready-for-pickup")

        assert response.status_code == 403

        with app.app_context():
            trip = db.session.get(Trip, trip_id)
            assert trip.status == TripStatus.PURCHASED


class TestCancelTrip:
    """Tests for PATCH /api/me/trips/<id>/cancel."""

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

        response = client.patch(f"/api/me/trips/{trip_id}/cancel")

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
                status=OrderStatus.CLAIMED,
            )
            db.session.add(order)
            db.session.commit()
            trip_id = trip.trip_id
            order_id = order.order_id
            _login(client, driver.email)

        response = client.patch(f"/api/me/trips/{trip_id}/cancel")

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

        response = client.patch(f"/api/me/trips/{trip_id}/cancel")

        assert response.status_code == 409


class TestGetTripOrders:
    """Tests for GET /api/me/trips/<id>/orders."""

    def test_get_trip_orders_success(self, client, app):
        """Driver can see orders on their trip."""
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
            item = Item(
                trip_id=trip.trip_id,
                name="Paper Towels",
                unit="pack",
                total_quantity=10,
                claimed_quantity=3,
            )
            db.session.add(item)
            db.session.flush()
            order = Order(
                shopper_id=shopper.user_id,
                trip_id=trip.trip_id,
            )
            db.session.add(order)
            db.session.flush()
            order_item = OrderItem(
                order_id=order.order_id,
                item_id=item.item_id,
                quantity=3,
            )
            db.session.add(order_item)
            db.session.commit()
            trip_id = trip.trip_id
            _login(client, driver.email)

        response = client.get(f"/api/me/trips/{trip_id}/orders")

        assert response.status_code == 200
        data = response.get_json()
        assert len(data["orders"]) == 1
        assert data["orders"][0]["shopper"]["name"] == "Shopper Test"
        assert "address" in data["orders"][0]["shopper"]
        assert len(data["orders"][0]["order_items"]) == 1

    def test_get_trip_orders_excludes_cancelled(self, client, app):
        """Cancelled orders are not shown to driver."""
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
                status=OrderStatus.CANCELLED,
            )
            db.session.add(order)
            db.session.commit()
            trip_id = trip.trip_id
            _login(client, driver.email)

        response = client.get(f"/api/me/trips/{trip_id}/orders")

        assert response.status_code == 200
        assert len(response.get_json()["orders"]) == 0

    def test_get_trip_orders_wrong_driver(self, client, app):
        """Cannot view orders for another driver's trip."""
        with app.app_context():
            driver = _make_driver(db)
            other_driver = _make_driver(db, email="other_driver@example.com")
            trip = Trip(
                driver_id=driver.user_id,
                store_name="Costco",
                pickup_location_text="123 Main St",
                pickup_time=datetime.now(timezone.utc) + timedelta(days=1),
            )
            db.session.add(trip)
            db.session.commit()
            trip_id = trip.trip_id
            _login(client, other_driver.email)

        response = client.get(f"/api/me/trips/{trip_id}/orders")

        assert response.status_code == 403
