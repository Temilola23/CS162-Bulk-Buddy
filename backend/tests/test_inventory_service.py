from datetime import datetime, timedelta, timezone

from werkzeug.security import generate_password_hash

from app.extensions import db
from app.models import Item, Trip, User
from app.models.enums import TripStatus, UserRole
from app.services.inventory_service import get_available_inventory


def _make_user(email, role=UserRole.SHOPPER):
    """Helper to create a test user."""
    user = User(
        first_name="Test",
        last_name=role.value.title(),
        email=email,
        password_hash=generate_password_hash("password123"),
        role=role,
        address_street="1 Test St",
        address_city="San Francisco",
        address_state="CA",
        address_zip="94101",
    )
    db.session.add(user)
    db.session.commit()
    return user


def _make_trip(driver, status=TripStatus.OPEN, pickup_time=None):
    """Helper to create a trip."""
    if pickup_time is None:
        pickup_time = datetime.now(timezone.utc) + timedelta(days=1)

    trip = Trip(
        driver_id=driver.user_id,
        store_name="Costco",
        pickup_location_text="123 Main St",
        pickup_time=pickup_time,
        status=status,
    )
    db.session.add(trip)
    db.session.commit()
    return trip


class TestGetAvailableInventoryService:
    """Service-level tests for get_available_inventory function."""

    def test_returns_items_from_open_trips(self, app):
        """Inventory includes items from OPEN trips."""
        with app.app_context():
            driver = _make_user("driver@example.com", UserRole.DRIVER)
            trip = _make_trip(driver, TripStatus.OPEN)

            item = Item(
                trip_id=trip.trip_id,
                name="Paper Towels",
                unit="pack",
                total_quantity=10,
                claimed_quantity=0,
                price_per_unit=15.99,
            )
            db.session.add(item)
            db.session.commit()

            inventory = get_available_inventory()

            assert len(inventory) == 1
            assert inventory[0]["name"] == "Paper Towels"

    def test_excludes_fully_claimed_items(self, app):
        """Inventory excludes items that are fully claimed."""
        with app.app_context():
            driver = _make_user("driver@example.com", UserRole.DRIVER)
            trip = _make_trip(driver, TripStatus.OPEN)

            item_available = Item(
                trip_id=trip.trip_id,
                name="Paper Towels",
                unit="pack",
                total_quantity=10,
                claimed_quantity=5,
                price_per_unit=15.99,
            )
            item_claimed = Item(
                trip_id=trip.trip_id,
                name="Olive Oil",
                unit="bottle",
                total_quantity=5,
                claimed_quantity=5,
                price_per_unit=12.50,
            )
            db.session.add_all([item_available, item_claimed])
            db.session.commit()

            inventory = get_available_inventory()

            assert len(inventory) == 1
            assert inventory[0]["name"] == "Paper Towels"

    def test_excludes_non_open_trips(self, app):
        """Inventory excludes items from non-OPEN trips."""
        with app.app_context():
            driver = _make_user("driver@example.com", UserRole.DRIVER)

            trip_open = _make_trip(driver, TripStatus.OPEN)
            trip_closed = _make_trip(driver, TripStatus.CLOSED)

            item_open = Item(
                trip_id=trip_open.trip_id,
                name="Paper Towels",
                unit="pack",
                total_quantity=10,
                claimed_quantity=0,
                price_per_unit=15.99,
            )
            item_closed = Item(
                trip_id=trip_closed.trip_id,
                name="Olive Oil",
                unit="bottle",
                total_quantity=5,
                claimed_quantity=0,
                price_per_unit=12.50,
            )
            db.session.add_all([item_open, item_closed])
            db.session.commit()

            inventory = get_available_inventory()

            assert len(inventory) == 1
            assert inventory[0]["name"] == "Paper Towels"

    def test_excludes_driver_own_items(self, app):
        """Inventory excludes items from the specified driver's trips."""
        with app.app_context():
            driver = _make_user("driver@example.com", UserRole.DRIVER)
            other_driver = _make_user("other@example.com", UserRole.DRIVER)

            trip_driver = _make_trip(driver, TripStatus.OPEN)
            trip_other = _make_trip(other_driver, TripStatus.OPEN)

            item_driver = Item(
                trip_id=trip_driver.trip_id,
                name="Paper Towels",
                unit="pack",
                total_quantity=10,
                claimed_quantity=0,
                price_per_unit=15.99,
            )
            item_other = Item(
                trip_id=trip_other.trip_id,
                name="Olive Oil",
                unit="bottle",
                total_quantity=5,
                claimed_quantity=0,
                price_per_unit=12.50,
            )
            db.session.add_all([item_driver, item_other])
            db.session.commit()

            inventory = get_available_inventory(
                exclude_driver_id=driver.user_id
            )

            assert len(inventory) == 1
            assert inventory[0]["name"] == "Olive Oil"
            assert (
                inventory[0]["trip"]["driver"]["user_id"]
                == other_driver.user_id
            )

    def test_sorted_by_pickup_time(self, app):
        """Inventory is sorted by pickup time ascending."""
        with app.app_context():
            driver = _make_user("driver@example.com", UserRole.DRIVER)

            now = datetime.now(timezone.utc)
            trip1 = _make_trip(
                driver, TripStatus.OPEN, now + timedelta(days=3)
            )
            trip2 = _make_trip(
                driver, TripStatus.OPEN, now + timedelta(days=1)
            )
            trip3 = _make_trip(
                driver, TripStatus.OPEN, now + timedelta(days=2)
            )

            item1 = Item(
                trip_id=trip1.trip_id,
                name="Item 1",
                unit="pack",
                total_quantity=10,
                claimed_quantity=0,
                price_per_unit=15.99,
            )
            item2 = Item(
                trip_id=trip2.trip_id,
                name="Item 2",
                unit="pack",
                total_quantity=10,
                claimed_quantity=0,
                price_per_unit=15.99,
            )
            item3 = Item(
                trip_id=trip3.trip_id,
                name="Item 3",
                unit="pack",
                total_quantity=10,
                claimed_quantity=0,
                price_per_unit=15.99,
            )
            db.session.add_all([item1, item2, item3])
            db.session.commit()

            inventory = get_available_inventory()

            assert len(inventory) == 3
            assert inventory[0]["name"] == "Item 2"
            assert inventory[1]["name"] == "Item 3"
            assert inventory[2]["name"] == "Item 1"

    def test_includes_trip_and_driver_info(self, app):
        """Inventory includes nested trip and driver information."""
        with app.app_context():
            driver = _make_user("driver@example.com", UserRole.DRIVER)
            trip = _make_trip(driver, TripStatus.OPEN)

            item = Item(
                trip_id=trip.trip_id,
                name="Paper Towels",
                unit="pack",
                total_quantity=10,
                claimed_quantity=0,
                price_per_unit=15.99,
            )
            db.session.add(item)
            db.session.commit()

            inventory = get_available_inventory()

            assert len(inventory) == 1
            assert "trip" in inventory[0]
            assert "driver" in inventory[0]["trip"]
            assert inventory[0]["trip"]["store_name"] == "Costco"
