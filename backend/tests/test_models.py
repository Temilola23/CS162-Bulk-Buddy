import pytest
from datetime import datetime, timezone
from sqlalchemy.exc import IntegrityError, StatementError

from app.models import User, Trip, Item, Order, OrderItem, DriverApplication
from app.models.enums import (
    UserRole,
    TripStatus,
    OrderStatus,
    ApplicationStatus,
)


def _make_user(db_session, **overrides):
    """Helper to create a user with sensible defaults."""
    defaults = dict(
        first_name="test",
        last_name="user",
        email="test@example.com",
        password_hash="hash",
        address_street="1 test st",
        address_city="test city",
        address_state="TS",
        address_zip="000",
    )
    defaults.update(overrides)
    user = User(**defaults)
    db_session.session.add(user)
    db_session.session.commit()
    return user


def _make_trip(db_session, driver, **overrides):
    """Helper to create a trip with sensible defaults."""
    defaults = dict(
        driver_id=driver.user_id,
        store_name="Costco",
        pickup_location_text="123 Main St",
        pickup_time=datetime(2026, 6, 1, 10, 0, tzinfo=timezone.utc),
    )
    defaults.update(overrides)
    trip = Trip(**defaults)
    db_session.session.add(trip)
    db_session.session.commit()
    return trip


class TestUser:
    """Tests for the User model."""

    def test_user_has_user_id_pk(self, db_session):
        """User primary key should be named user_id."""
        user = _make_user(db_session, email="pk@example.com")
        assert user.user_id is not None
        assert isinstance(user.user_id, int)

    def test_user_default_role(self, db_session):
        """User role should default to UserRole.SHOPPER."""
        user = _make_user(db_session, email="role@example.com")
        assert user.role == UserRole.SHOPPER

    def test_user_email_unique(self, db_session):
        """Duplicate email should raise IntegrityError."""
        _make_user(db_session, email="dupe@example.com")
        with pytest.raises(IntegrityError):
            _make_user(db_session, email="dupe@example.com")

    def test_user_requires_email(self, db_session):
        """User without email should raise IntegrityError."""
        with pytest.raises(IntegrityError):
            _make_user(db_session, email=None)

    def test_user_invalid_role_rejected(self, db_session):
        """Setting an invalid role should raise StatementError."""
        user = _make_user(db_session, email="badrole@example.com")
        user.role = "superadmin"
        with pytest.raises(StatementError):
            db_session.session.commit()

    def test_user_requires_first_name(self, db_session):
        """User without first_name should raise IntegrityError."""
        with pytest.raises(IntegrityError):
            _make_user(
                db_session,
                email="nofirst@example.com",
                first_name=None,
            )

    def test_user_requires_password_hash(self, db_session):
        """User without password_hash should raise IntegrityError."""
        with pytest.raises(IntegrityError):
            _make_user(
                db_session,
                email="nopw@example.com",
                password_hash=None,
            )

    def test_user_repr(self, db_session):
        """User __repr__ should include user_id and email."""
        user = _make_user(db_session, email="repr@example.com")
        result = repr(user)
        assert "repr@example.com" in result
        assert str(user.user_id) in result


class TestTrip:
    """Tests for the Trip model."""

    def test_trip_has_trip_id_pk(self, db_session):
        """Trip primary key should be named trip_id."""
        driver = _make_user(db_session, email="driver@example.com")
        trip = _make_trip(db_session, driver)
        assert trip.trip_id is not None
        assert isinstance(trip.trip_id, int)

    def test_trip_default_status(self, db_session):
        """Trip status should default to TripStatus.OPEN."""
        driver = _make_user(db_session, email="driver2@example.com")
        trip = _make_trip(db_session, driver)
        assert trip.status == TripStatus.OPEN

    def test_trip_driver_relationship(self, db_session):
        """trip.driver returns User, user.trips returns trips."""
        driver = _make_user(db_session, email="driver3@example.com")
        trip = _make_trip(db_session, driver)
        assert trip.driver.user_id == driver.user_id
        assert trip in driver.trips.all()

    def test_trip_nullable_coords(self, db_session):
        """Trip can be created without lat/lng."""
        driver = _make_user(db_session, email="driver4@example.com")
        trip = _make_trip(
            db_session,
            driver,
            pickup_lat=None,
            pickup_lng=None,
        )
        assert trip.trip_id is not None
        assert trip.pickup_lat is None
        assert trip.pickup_lng is None

    def test_trip_cascade_deletes_items(self, db_session):
        """Deleting a trip should delete its items."""
        driver = _make_user(db_session, email="driver5@example.com")
        trip = _make_trip(db_session, driver)
        item = Item(
            trip_id=trip.trip_id,
            name="Paper Towels",
            unit="pack",
            total_quantity=10,
        )
        db_session.session.add(item)
        db_session.session.commit()

        db_session.session.delete(trip)
        db_session.session.commit()

        assert db_session.session.get(Item, item.item_id) is None

    def test_trip_invalid_status_rejected(self, db_session):
        """Setting an invalid status should raise StatementError."""
        driver = _make_user(db_session, email="driver6@example.com")
        trip = _make_trip(db_session, driver)
        trip.status = "archived"
        with pytest.raises(StatementError):
            db_session.session.commit()

    def test_trip_requires_store_name(self, db_session):
        """Trip without store_name should raise IntegrityError."""
        driver = _make_user(db_session, email="driver7@example.com")
        with pytest.raises(IntegrityError):
            _make_trip(db_session, driver, store_name=None)

    def test_trip_requires_driver(self, db_session):
        """Trip with non-existent driver should raise error."""
        with pytest.raises(IntegrityError):
            trip = Trip(
                driver_id=99999,
                store_name="Costco",
                pickup_location_text="123 Main St",
                pickup_time=datetime(2026, 6, 1, 10, 0, tzinfo=timezone.utc),
            )
            db_session.session.add(trip)
            db_session.session.commit()


class TestItem:
    """Tests for the Item model."""

    def test_item_has_item_id_pk(self, db_session):
        """Item primary key should be named item_id."""
        driver = _make_user(db_session, email="idriver@example.com")
        trip = _make_trip(db_session, driver)
        item = Item(
            trip_id=trip.trip_id,
            name="Toilet Paper",
            unit="pack",
            total_quantity=20,
        )
        db_session.session.add(item)
        db_session.session.commit()
        assert item.item_id is not None

    def test_item_default_claimed_zero(self, db_session):
        """claimed_quantity should default to 0."""
        driver = _make_user(db_session, email="idriver2@example.com")
        trip = _make_trip(db_session, driver)
        item = Item(
            trip_id=trip.trip_id,
            name="Rice",
            unit="bag",
            total_quantity=5,
        )
        db_session.session.add(item)
        db_session.session.commit()
        assert item.claimed_quantity == 0

    def test_item_available_quantity(self, db_session):
        """available_quantity = total - claimed."""
        driver = _make_user(db_session, email="idriver3@example.com")
        trip = _make_trip(db_session, driver)
        item = Item(
            trip_id=trip.trip_id,
            name="Water",
            unit="case",
            total_quantity=10,
            claimed_quantity=3,
        )
        db_session.session.add(item)
        db_session.session.commit()
        assert item.available_quantity == 7

    def test_item_requires_name(self, db_session):
        """Item without name should raise IntegrityError."""
        driver = _make_user(db_session, email="idriver4@example.com")
        trip = _make_trip(db_session, driver)
        with pytest.raises(IntegrityError):
            item = Item(
                trip_id=trip.trip_id,
                name=None,
                unit="pack",
                total_quantity=10,
            )
            db_session.session.add(item)
            db_session.session.commit()

    def test_item_requires_valid_trip(self, db_session):
        """Item with non-existent trip should raise error."""
        with pytest.raises(IntegrityError):
            item = Item(
                trip_id=99999,
                name="Ghost Item",
                unit="pack",
                total_quantity=10,
            )
            db_session.session.add(item)
            db_session.session.commit()


class TestOrder:
    """Tests for the Order model."""

    def test_order_has_order_id_pk(self, db_session):
        """Order primary key should be named order_id."""
        driver = _make_user(db_session, email="odriver@example.com")
        shopper = _make_user(db_session, email="oshopper@example.com")
        trip = _make_trip(db_session, driver)
        order = Order(
            shopper_id=shopper.user_id,
            trip_id=trip.trip_id,
        )
        db_session.session.add(order)
        db_session.session.commit()
        assert order.order_id is not None

    def test_order_default_status(self, db_session):
        """Order status should default to OrderStatus.CLAIMED."""
        driver = _make_user(db_session, email="odriver2@example.com")
        shopper = _make_user(db_session, email="oshopper2@example.com")
        trip = _make_trip(db_session, driver)
        order = Order(
            shopper_id=shopper.user_id,
            trip_id=trip.trip_id,
        )
        db_session.session.add(order)
        db_session.session.commit()
        assert order.status == OrderStatus.CLAIMED

    def test_order_status_enum(self, db_session):
        """Order can be set to each valid enum value."""
        driver = _make_user(db_session, email="odriver3@example.com")
        shopper = _make_user(db_session, email="oshopper3@example.com")
        trip = _make_trip(db_session, driver)
        order = Order(
            shopper_id=shopper.user_id,
            trip_id=trip.trip_id,
        )
        db_session.session.add(order)
        db_session.session.commit()

        for status in OrderStatus:
            order.status = status
            db_session.session.commit()
            assert order.status == status

    def test_order_invalid_status_rejected(self, db_session):
        """Setting an invalid order status should raise error."""
        driver = _make_user(db_session, email="odriver4@example.com")
        shopper = _make_user(db_session, email="oshopper4@example.com")
        trip = _make_trip(db_session, driver)
        order = Order(
            shopper_id=shopper.user_id,
            trip_id=trip.trip_id,
        )
        db_session.session.add(order)
        db_session.session.commit()

        order.status = "shipped"
        with pytest.raises(StatementError):
            db_session.session.commit()

    def test_order_requires_shopper(self, db_session):
        """Order with non-existent shopper should raise error."""
        driver = _make_user(db_session, email="odriver5@example.com")
        trip = _make_trip(db_session, driver)
        with pytest.raises(IntegrityError):
            order = Order(
                shopper_id=99999,
                trip_id=trip.trip_id,
            )
            db_session.session.add(order)
            db_session.session.commit()


class TestOrderItem:
    """Tests for the OrderItem model."""

    def test_order_item_has_order_item_id_pk(self, db_session):
        """OrderItem primary key should be named order_item_id."""
        driver = _make_user(db_session, email="oidriver@example.com")
        shopper = _make_user(db_session, email="oishopper@example.com")
        trip = _make_trip(db_session, driver)
        item = Item(
            trip_id=trip.trip_id,
            name="Chips",
            unit="bag",
            total_quantity=10,
        )
        order = Order(
            shopper_id=shopper.user_id,
            trip_id=trip.trip_id,
        )
        db_session.session.add_all([item, order])
        db_session.session.commit()

        oi = OrderItem(
            order_id=order.order_id,
            item_id=item.item_id,
            quantity=2,
        )
        db_session.session.add(oi)
        db_session.session.commit()
        assert oi.order_item_id is not None

    def test_order_item_relationships(self, db_session):
        """order_item.order and order_item.item should work."""
        driver = _make_user(db_session, email="oidriver2@example.com")
        shopper = _make_user(db_session, email="oishopper2@example.com")
        trip = _make_trip(db_session, driver)
        item = Item(
            trip_id=trip.trip_id,
            name="Soda",
            unit="case",
            total_quantity=5,
        )
        order = Order(
            shopper_id=shopper.user_id,
            trip_id=trip.trip_id,
        )
        db_session.session.add_all([item, order])
        db_session.session.commit()

        oi = OrderItem(
            order_id=order.order_id,
            item_id=item.item_id,
            quantity=1,
        )
        db_session.session.add(oi)
        db_session.session.commit()

        assert oi.order.order_id == order.order_id
        assert oi.item.item_id == item.item_id


class TestDriverApplication:
    """Tests for the DriverApplication model."""

    def test_application_has_driver_application_id_pk(self, db_session):
        """
        DriverApplication primary key should be named
        driver_application_id.
        """
        user = _make_user(db_session, email="applicant@example.com")
        app = DriverApplication(user_id=user.user_id)
        db_session.session.add(app)
        db_session.session.commit()
        assert app.driver_application_id is not None

    def test_application_default_status(self, db_session):
        """
        DriverApplication status should default to
        ApplicationStatus.PENDING.
        """
        user = _make_user(db_session, email="applicant2@example.com")
        app = DriverApplication(user_id=user.user_id)
        db_session.session.add(app)
        db_session.session.commit()
        assert app.status == ApplicationStatus.PENDING

    def test_application_invalid_status_rejected(self, db_session):
        """
        Setting an invalid application status should raise
        StatementError.
        """
        user = _make_user(db_session, email="applicant3@example.com")
        app = DriverApplication(user_id=user.user_id)
        db_session.session.add(app)
        db_session.session.commit()

        app.status = "waitlisted"
        with pytest.raises(StatementError):
            db_session.session.commit()

    def test_application_requires_user(self, db_session):
        """
        DriverApplication with non-existent user should raise
        IntegrityError.
        """
        with pytest.raises(IntegrityError):
            app = DriverApplication(user_id=99999)
            db_session.session.add(app)
            db_session.session.commit()
