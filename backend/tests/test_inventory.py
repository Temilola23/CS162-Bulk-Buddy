from datetime import datetime, timezone, timedelta

from app.extensions import db
from app.models import User, Trip, Item
from app.models.enums import UserRole, TripStatus
from werkzeug.security import generate_password_hash


def _make_driver(db_session, email="driver@example.com"):
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
    client.post(
        "/api/login",
        json={"email": email, "password": password},
    )


def _make_open_trip_with_items(db_session, driver, **trip_overrides):
    """Create an OPEN trip with two items that have availability."""
    defaults = dict(
        driver_id=driver.user_id,
        store_name="Costco",
        pickup_location_text="123 Main St",
        pickup_time=datetime.now(timezone.utc) + timedelta(days=1),
        status=TripStatus.OPEN,
    )
    defaults.update(trip_overrides)
    trip = Trip(**defaults)
    db_session.session.add(trip)
    db_session.session.flush()

    item_a = Item(
        trip_id=trip.trip_id,
        name="Paper Towels",
        unit="pack",
        total_quantity=10,
        claimed_quantity=3,
        price_per_unit=15.99,
    )
    item_b = Item(
        trip_id=trip.trip_id,
        name="Soap",
        unit="bottle",
        total_quantity=8,
        claimed_quantity=8,
        price_per_unit=9.99,
    )
    db_session.session.add_all([item_a, item_b])
    db_session.session.commit()
    return trip, item_a, item_b


class TestInventoryRoute:
    """Tests for GET /api/inventory."""

    def test_inventory_requires_login(self, client):
        """Unauthenticated requests should return 401."""
        response = client.get("/api/inventory")

        assert response.status_code == 401

    def test_inventory_returns_open_trip_items(self, client, app):
        """Items from open trips with availability are returned."""
        with app.app_context():
            driver = _make_driver(db)
            shopper = _make_shopper(db)
            trip, item_a, _item_b = _make_open_trip_with_items(db, driver)
            _login(client, shopper.email)

        response = client.get("/api/inventory")

        assert response.status_code == 200
        items = response.json["items"]
        # item_a has availability (10 - 3 = 7), item_b is fully
        # claimed (8 - 8 = 0) so only item_a should appear
        assert len(items) == 1
        assert items[0]["name"] == "Paper Towels"
        assert items[0]["available_quantity"] == 7
        # Each item should include its trip with driver info
        assert "trip" in items[0]
        assert items[0]["trip"]["store_name"] == "Costco"
        assert "driver" in items[0]["trip"]

    def test_inventory_excludes_zero_availability(self, client, app):
        """Fully claimed items should not appear in inventory."""
        with app.app_context():
            driver = _make_driver(db)
            shopper = _make_shopper(db)
            trip = Trip(
                driver_id=driver.user_id,
                store_name="Costco",
                pickup_location_text="123 Main St",
                pickup_time=(datetime.now(timezone.utc) + timedelta(days=1)),
                status=TripStatus.OPEN,
            )
            db.session.add(trip)
            db.session.flush()
            item = Item(
                trip_id=trip.trip_id,
                name="Sold Out Item",
                unit="box",
                total_quantity=5,
                claimed_quantity=5,
                price_per_unit=10.00,
            )
            db.session.add(item)
            db.session.commit()
            _login(client, shopper.email)

        response = client.get("/api/inventory")

        assert response.status_code == 200
        assert len(response.json["items"]) == 0

    def test_inventory_excludes_non_open_trips(self, client, app):
        """Items on closed, completed, or cancelled trips are excluded."""
        with app.app_context():
            driver = _make_driver(db)
            shopper = _make_shopper(db)
            for status in [
                TripStatus.CLOSED,
                TripStatus.COMPLETED,
                TripStatus.CANCELLED,
                TripStatus.PURCHASED,
                TripStatus.READY_FOR_PICKUP,
            ]:
                trip = Trip(
                    driver_id=driver.user_id,
                    store_name=f"Store ({status.value})",
                    pickup_location_text="Addr",
                    pickup_time=(
                        datetime.now(timezone.utc) + timedelta(days=1)
                    ),
                    status=status,
                )
                db.session.add(trip)
                db.session.flush()
                db.session.add(
                    Item(
                        trip_id=trip.trip_id,
                        name=f"Item ({status.value})",
                        unit="each",
                        total_quantity=10,
                        claimed_quantity=0,
                        price_per_unit=5.00,
                    )
                )
            db.session.commit()
            _login(client, shopper.email)

        response = client.get("/api/inventory")

        assert response.status_code == 200
        assert len(response.json["items"]) == 0

    def test_inventory_excludes_current_drivers_items(self, client, app):
        """A driver's own trip items should not appear in their feed."""
        with app.app_context():
            driver = _make_driver(db)
            other_driver = _make_driver(db, email="other@example.com")
            # Give the logged-in driver a trip with available items
            _make_open_trip_with_items(db, driver)
            # And another driver has a trip with availability
            _make_open_trip_with_items(
                db,
                other_driver,
                store_name="Sam's Club",
                pickup_location_text="999 Other St",
            )
            _login(client, driver.email)

        response = client.get("/api/inventory")

        assert response.status_code == 200
        items = response.json["items"]
        # Only the other driver's items should be visible
        assert len(items) >= 1
        for item in items:
            assert item["trip"]["store_name"] == "Sam's Club"

    def test_inventory_sorted_by_pickup_time(self, client, app):
        """Items should be ordered by trip pickup_time ascending."""
        with app.app_context():
            driver = _make_driver(db)
            shopper = _make_shopper(db)

            later_trip = Trip(
                driver_id=driver.user_id,
                store_name="Later Store",
                pickup_location_text="456 Far St",
                pickup_time=(datetime.now(timezone.utc) + timedelta(days=3)),
                status=TripStatus.OPEN,
            )
            sooner_trip = Trip(
                driver_id=driver.user_id,
                store_name="Sooner Store",
                pickup_location_text="789 Near St",
                pickup_time=(datetime.now(timezone.utc) + timedelta(days=1)),
                status=TripStatus.OPEN,
            )
            db.session.add_all([later_trip, sooner_trip])
            db.session.flush()

            db.session.add(
                Item(
                    trip_id=later_trip.trip_id,
                    name="Later Item",
                    unit="each",
                    total_quantity=5,
                    claimed_quantity=0,
                    price_per_unit=5.00,
                )
            )
            db.session.add(
                Item(
                    trip_id=sooner_trip.trip_id,
                    name="Sooner Item",
                    unit="each",
                    total_quantity=5,
                    claimed_quantity=0,
                    price_per_unit=5.00,
                )
            )
            db.session.commit()
            _login(client, shopper.email)

        response = client.get("/api/inventory")

        assert response.status_code == 200
        items = response.json["items"]
        assert len(items) == 2
        assert items[0]["name"] == "Sooner Item"
        assert items[1]["name"] == "Later Item"
