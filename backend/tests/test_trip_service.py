from datetime import datetime, timedelta, timezone

from werkzeug.security import generate_password_hash

from app.extensions import db
from app.models import Item, Order, OrderItem, Trip, User
from app.models.enums import OrderStatus, TripStatus, UserRole
from app.services.trip_service import (
    _cascade_order_status,
    cancel_trip,
    close_trip,
    complete_trip,
    create_trip,
    get_driver_trips,
    get_open_trips,
    get_trip,
    get_trip_orders,
    mark_trip_purchased,
    mark_trip_ready_for_pickup,
    update_trip,
)


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


def _make_open_trip_with_items(driver):
    """Helper to create an open trip with items."""
    trip = Trip(
        driver_id=driver.user_id,
        store_name="Costco",
        pickup_location_text="123 Main St",
        pickup_time=datetime.now(timezone.utc) + timedelta(days=1),
        status=TripStatus.OPEN,
    )
    db.session.add(trip)
    db.session.flush()

    paper_towels = Item(
        trip_id=trip.trip_id,
        name="Paper Towels",
        unit="pack",
        total_quantity=8,
        claimed_quantity=0,
        price_per_unit=15.99,
    )
    olive_oil = Item(
        trip_id=trip.trip_id,
        name="Olive Oil",
        unit="bottle",
        total_quantity=6,
        claimed_quantity=0,
        price_per_unit=12.50,
    )
    db.session.add_all([paper_towels, olive_oil])
    db.session.commit()
    return trip, paper_towels, olive_oil


class TestCreateTripService:
    """Service-level tests for create_trip function."""

    def test_create_trip_success(self, app):
        """Create a new trip with items."""
        with app.app_context():
            driver = _make_user("driver@example.com", UserRole.DRIVER)

            trip, error, status = create_trip(
                driver.user_id,
                {
                    "store_name": "Costco",
                    "pickup_location_text": "123 Main St",
                    "pickup_lat": 37.7749,
                    "pickup_lng": -122.4194,
                    "pickup_time": (
                        datetime.now(timezone.utc) + timedelta(days=1)
                    ).isoformat(),
                    "items": [
                        {
                            "name": "Paper Towels",
                            "unit": "pack",
                            "total_quantity": 8,
                            "price_per_unit": 15.99,
                        }
                    ],
                },
            )

            assert error is None
            assert status == 201
            assert trip is not None
            assert trip.store_name == "Costco"
            assert trip.items.count() == 1

    def test_create_trip_non_driver_rejected(self, app):
        """Only drivers can create trips."""
        with app.app_context():
            shopper = _make_user("shopper@example.com", UserRole.SHOPPER)

            trip, error, status = create_trip(
                shopper.user_id,
                {
                    "store_name": "Costco",
                    "pickup_location_text": "123 Main St",
                    "pickup_time": (
                        datetime.now(timezone.utc) + timedelta(days=1)
                    ).isoformat(),
                    "items": [],
                },
            )

            assert trip is None
            assert error == "Only drivers can create trips"
            assert status == 403

    def test_create_trip_missing_fields(self, app):
        """Create trip with missing required fields."""
        with app.app_context():
            driver = _make_user("driver@example.com", UserRole.DRIVER)

            trip, error, status = create_trip(
                driver.user_id,
                {
                    "store_name": "Costco",
                },
            )

            assert trip is None
            assert status == 400
            assert "required" in error.lower()

    def test_create_trip_bad_pickup_time(self, app):
        """Create trip with invalid pickup_time format."""
        with app.app_context():
            driver = _make_user("driver@example.com", UserRole.DRIVER)

            trip, error, status = create_trip(
                driver.user_id,
                {
                    "store_name": "Costco",
                    "pickup_location_text": "123 Main St",
                    "pickup_time": "invalid-date-time",
                    "items": [],
                },
            )

            assert trip is None
            assert "ISO 8601" in error or "valid" in error.lower()
            assert status == 400


class TestGetOpenTripsService:
    """Service-level tests for get_open_trips function."""

    def test_get_open_trips_returns_open_only(self, app):
        """get_open_trips returns only OPEN trips."""
        with app.app_context():
            driver = _make_user("driver@example.com", UserRole.DRIVER)

            trip1, _, _ = _make_open_trip_with_items(driver)
            trip2, _, _ = _make_open_trip_with_items(driver)
            trip2.status = TripStatus.CLOSED
            db.session.commit()

            trips = get_open_trips()

            assert len(trips) == 1
            assert trips[0].trip_id == trip1.trip_id

    def test_get_open_trips_excludes_driver_own(self, app):
        """get_open_trips excludes driver's own trips."""
        with app.app_context():
            driver = _make_user("driver@example.com", UserRole.DRIVER)
            other_driver = _make_user("other@example.com", UserRole.DRIVER)

            _trip1, _, _ = _make_open_trip_with_items(driver)
            trip2, _, _ = _make_open_trip_with_items(other_driver)

            trips = get_open_trips(exclude_driver_id=driver.user_id)

            assert len(trips) == 1
            assert trips[0].driver_id == other_driver.user_id


class TestGetTripService:
    """Service-level tests for get_trip function."""

    def test_get_trip_found(self, app):
        """Get an existing trip."""
        with app.app_context():
            driver = _make_user("driver@example.com", UserRole.DRIVER)
            trip, _, _ = _make_open_trip_with_items(driver)

            found_trip = get_trip(trip.trip_id)

            assert found_trip is not None
            assert found_trip.trip_id == trip.trip_id

    def test_get_trip_not_found(self, app):
        """Get non-existent trip."""
        with app.app_context():
            found_trip = get_trip(99999)

            assert found_trip is None


class TestGetDriverTripsService:
    """Service-level tests for get_driver_trips function."""

    def test_get_driver_trips_returns_only_that_driver(self, app):
        """get_driver_trips returns only that driver's trips."""
        with app.app_context():
            driver = _make_user("driver@example.com", UserRole.DRIVER)
            other_driver = _make_user("other@example.com", UserRole.DRIVER)

            trip1, _, _ = _make_open_trip_with_items(driver)
            trip2, _, _ = _make_open_trip_with_items(driver)
            _trip3, _, _ = _make_open_trip_with_items(other_driver)

            trips = get_driver_trips(driver.user_id)

            assert len(trips) == 2
            assert all(trip.driver_id == driver.user_id for trip in trips)


class TestUpdateTripService:
    """Service-level tests for update_trip function."""

    def test_update_trip_success(self, app):
        """Update an OPEN trip."""
        with app.app_context():
            driver = _make_user("driver@example.com", UserRole.DRIVER)
            trip, _, _ = _make_open_trip_with_items(driver)

            updated_trip, error, status = update_trip(
                trip.trip_id,
                driver.user_id,
                {"store_name": "Whole Foods"},
            )

            assert error is None
            assert status == 200
            assert updated_trip.store_name == "Whole Foods"

    def test_update_trip_not_found(self, app):
        """Update non-existent trip."""
        with app.app_context():
            driver = _make_user("driver@example.com", UserRole.DRIVER)

            trip, error, status = update_trip(
                99999,
                driver.user_id,
                {"store_name": "Whole Foods"},
            )

            assert trip is None
            assert error == "Trip not found"
            assert status == 404

    def test_update_trip_not_owner(self, app):
        """Cannot update trip owned by another driver."""
        with app.app_context():
            driver = _make_user("driver@example.com", UserRole.DRIVER)
            other_driver = _make_user("other@example.com", UserRole.DRIVER)
            trip, _, _ = _make_open_trip_with_items(driver)

            updated_trip, error, status = update_trip(
                trip.trip_id,
                other_driver.user_id,
                {"store_name": "Whole Foods"},
            )

            assert updated_trip is None
            assert error == "You can only edit your own trips"
            assert status == 403

    def test_update_trip_not_open(self, app):
        """Cannot update trip that is not OPEN."""
        with app.app_context():
            driver = _make_user("driver@example.com", UserRole.DRIVER)
            trip, _, _ = _make_open_trip_with_items(driver)
            trip.status = TripStatus.CLOSED
            db.session.commit()

            updated_trip, error, status = update_trip(
                trip.trip_id,
                driver.user_id,
                {"store_name": "Whole Foods"},
            )

            assert updated_trip is None
            assert error == "Can only edit OPEN trips"
            assert status == 409

    def test_update_trip_quantity_below_claimed(self, app):
        """Cannot reduce total_quantity below claimed_quantity."""
        with app.app_context():
            driver = _make_user("driver@example.com", UserRole.DRIVER)
            trip, paper_towels, _ = _make_open_trip_with_items(driver)
            paper_towels.claimed_quantity = 5
            db.session.commit()

            updated_trip, error, status = update_trip(
                trip.trip_id,
                driver.user_id,
                {
                    "items": [
                        {
                            "item_id": paper_towels.item_id,
                            "total_quantity": 3,
                        }
                    ]
                },
            )

            assert updated_trip is None
            assert "claimed" in error.lower()
            assert status == 409


class TestCloseTripService:
    """Service-level tests for close_trip function."""

    def test_close_trip_success(self, app):
        """Close an OPEN trip."""
        with app.app_context():
            driver = _make_user("driver@example.com", UserRole.DRIVER)
            trip, _, _ = _make_open_trip_with_items(driver)

            closed_trip, error, status = close_trip(
                trip.trip_id, driver.user_id
            )

            assert error is None
            assert status == 200
            assert closed_trip.status == TripStatus.CLOSED

    def test_close_trip_not_found(self, app):
        """Close non-existent trip."""
        with app.app_context():
            driver = _make_user("driver@example.com", UserRole.DRIVER)

            trip, error, status = close_trip(99999, driver.user_id)

            assert trip is None
            assert error == "Trip not found"
            assert status == 404

    def test_close_trip_not_owner(self, app):
        """Cannot close trip owned by another driver."""
        with app.app_context():
            driver = _make_user("driver@example.com", UserRole.DRIVER)
            other_driver = _make_user("other@example.com", UserRole.DRIVER)
            trip, _, _ = _make_open_trip_with_items(driver)

            closed_trip, error, status = close_trip(
                trip.trip_id, other_driver.user_id
            )

            assert closed_trip is None
            assert error == "You can only close your own trips"
            assert status == 403

    def test_close_trip_not_open(self, app):
        """Cannot close trip that is not OPEN."""
        with app.app_context():
            driver = _make_user("driver@example.com", UserRole.DRIVER)
            trip, _, _ = _make_open_trip_with_items(driver)
            trip.status = TripStatus.CLOSED
            db.session.commit()

            closed_trip, error, status = close_trip(
                trip.trip_id, driver.user_id
            )

            assert closed_trip is None
            assert error == "Can only close OPEN trips"
            assert status == 409


class TestMarkTripPurchasedService:
    """Service-level tests for mark_trip_purchased function."""

    def test_mark_trip_purchased_success_with_cascade(self, app):
        """Mark trip as purchased and cascade order status."""
        with app.app_context():
            driver = _make_user("driver@example.com", UserRole.DRIVER)
            shopper = _make_user("shopper@example.com", UserRole.SHOPPER)
            trip, _, _ = _make_open_trip_with_items(driver)
            trip.status = TripStatus.CLOSED
            db.session.commit()

            order = Order(shopper_id=shopper.user_id, trip_id=trip.trip_id)
            order.status = OrderStatus.CLAIMED
            db.session.add(order)
            db.session.commit()

            purchased_trip, error, status = mark_trip_purchased(
                trip.trip_id, driver.user_id
            )

            assert error is None
            assert status == 200
            assert purchased_trip.status == TripStatus.PURCHASED
            updated_order = db.session.get(Order, order.order_id)
            assert updated_order.status == OrderStatus.PURCHASED

    def test_mark_trip_purchased_not_closed(self, app):
        """Cannot mark trip as purchased if not CLOSED."""
        with app.app_context():
            driver = _make_user("driver@example.com", UserRole.DRIVER)
            trip, _, _ = _make_open_trip_with_items(driver)

            purchased_trip, error, status = mark_trip_purchased(
                trip.trip_id, driver.user_id
            )

            assert purchased_trip is None
            assert error == "Can only mark CLOSED trips as purchased"
            assert status == 409


class TestMarkTripReadyForPickupService:
    """Service-level tests for mark_trip_ready_for_pickup function."""

    def test_mark_trip_ready_for_pickup_success_with_cascade(self, app):
        """Mark trip ready for pickup and cascade order status."""
        with app.app_context():
            driver = _make_user("driver@example.com", UserRole.DRIVER)
            shopper = _make_user("shopper@example.com", UserRole.SHOPPER)
            trip, _, _ = _make_open_trip_with_items(driver)
            trip.status = TripStatus.PURCHASED
            db.session.commit()

            order = Order(shopper_id=shopper.user_id, trip_id=trip.trip_id)
            order.status = OrderStatus.PURCHASED
            db.session.add(order)
            db.session.commit()

            ready_trip, error, status = mark_trip_ready_for_pickup(
                trip.trip_id, driver.user_id
            )

            assert error is None
            assert status == 200
            assert ready_trip.status == TripStatus.READY_FOR_PICKUP
            updated_order = db.session.get(Order, order.order_id)
            assert updated_order.status == OrderStatus.READY_FOR_PICKUP

    def test_mark_trip_ready_for_pickup_not_purchased(self, app):
        """Cannot mark trip ready if not PURCHASED."""
        with app.app_context():
            driver = _make_user("driver@example.com", UserRole.DRIVER)
            trip, _, _ = _make_open_trip_with_items(driver)

            ready_trip, error, status = mark_trip_ready_for_pickup(
                trip.trip_id, driver.user_id
            )

            assert ready_trip is None
            assert error == "Can only mark PURCHASED trips ready for pickup"
            assert status == 409


class TestCompleteTripService:
    """Service-level tests for complete_trip function."""

    def test_complete_trip_success(self, app):
        """Complete a READY_FOR_PICKUP trip."""
        with app.app_context():
            driver = _make_user("driver@example.com", UserRole.DRIVER)
            trip, _, _ = _make_open_trip_with_items(driver)
            trip.status = TripStatus.READY_FOR_PICKUP
            db.session.commit()

            completed_trip, error, status = complete_trip(
                trip.trip_id, driver.user_id
            )

            assert error is None
            assert status == 200
            assert completed_trip.status == TripStatus.COMPLETED

    def test_complete_trip_not_ready_for_pickup(self, app):
        """Cannot complete trip that is not READY_FOR_PICKUP."""
        with app.app_context():
            driver = _make_user("driver@example.com", UserRole.DRIVER)
            trip, _, _ = _make_open_trip_with_items(driver)

            completed_trip, error, status = complete_trip(
                trip.trip_id, driver.user_id
            )

            assert completed_trip is None
            assert error == "Can only complete READY_FOR_PICKUP trips"
            assert status == 409


class TestCancelTripService:
    """Service-level tests for cancel_trip function."""

    def test_cancel_trip_success_with_inventory_revert(self, app):
        """Cancel an OPEN trip and revert inventory."""
        with app.app_context():
            driver = _make_user("driver@example.com", UserRole.DRIVER)
            shopper = _make_user("shopper@example.com", UserRole.SHOPPER)
            trip, paper_towels, olive_oil = _make_open_trip_with_items(driver)

            order = Order(shopper_id=shopper.user_id, trip_id=trip.trip_id)
            order.status = OrderStatus.CLAIMED
            db.session.add(order)
            db.session.flush()

            order_item_1 = OrderItem(
                order_id=order.order_id,
                item_id=paper_towels.item_id,
                quantity=2,
            )
            order_item_2 = OrderItem(
                order_id=order.order_id,
                item_id=olive_oil.item_id,
                quantity=1,
            )
            paper_towels.claimed_quantity = 2
            olive_oil.claimed_quantity = 1
            db.session.add_all([order_item_1, order_item_2])
            db.session.commit()

            cancelled_trip, error, status = cancel_trip(
                trip.trip_id, driver.user_id
            )

            assert error is None
            assert status == 200
            assert cancelled_trip.status == TripStatus.CANCELLED
            assert (
                db.session.get(Item, paper_towels.item_id).claimed_quantity
                == 0
            )
            assert (
                db.session.get(Item, olive_oil.item_id).claimed_quantity == 0
            )
            updated_order = db.session.get(Order, order.order_id)
            assert updated_order.status == OrderStatus.CANCELLED

    def test_cancel_trip_already_completed(self, app):
        """Cannot cancel completed trip."""
        with app.app_context():
            driver = _make_user("driver@example.com", UserRole.DRIVER)
            trip, _, _ = _make_open_trip_with_items(driver)
            trip.status = TripStatus.COMPLETED
            db.session.commit()

            cancelled_trip, error, status = cancel_trip(
                trip.trip_id, driver.user_id
            )

            assert cancelled_trip is None
            assert error == "Cannot cancel a completed trip"
            assert status == 409

    def test_cancel_trip_already_cancelled(self, app):
        """Cannot cancel already-cancelled trip."""
        with app.app_context():
            driver = _make_user("driver@example.com", UserRole.DRIVER)
            trip, _, _ = _make_open_trip_with_items(driver)
            trip.status = TripStatus.CANCELLED
            db.session.commit()

            cancelled_trip, error, status = cancel_trip(
                trip.trip_id, driver.user_id
            )

            assert cancelled_trip is None
            assert error == "Trip already cancelled"
            assert status == 409


class TestGetTripOrdersService:
    """Service-level tests for get_trip_orders function."""

    def test_get_trip_orders_success(self, app):
        """Get all non-cancelled orders for a trip."""
        with app.app_context():
            driver = _make_user("driver@example.com", UserRole.DRIVER)
            shopper = _make_user("shopper@example.com", UserRole.SHOPPER)
            trip, paper_towels, _ = _make_open_trip_with_items(driver)

            order = Order(shopper_id=shopper.user_id, trip_id=trip.trip_id)
            order.status = OrderStatus.CLAIMED
            db.session.add(order)
            db.session.flush()

            order_item = OrderItem(
                order_id=order.order_id,
                item_id=paper_towels.item_id,
                quantity=2,
            )
            db.session.add(order_item)
            db.session.commit()

            orders, error, status = get_trip_orders(
                trip.trip_id, driver.user_id
            )

            assert error is None
            assert status == 200
            assert len(orders) == 1
            assert "shopper" in orders[0]

    def test_get_trip_orders_not_owner(self, app):
        """Cannot get trip orders if not trip owner."""
        with app.app_context():
            driver = _make_user("driver@example.com", UserRole.DRIVER)
            other_driver = _make_user("other@example.com", UserRole.DRIVER)
            trip, _, _ = _make_open_trip_with_items(driver)

            orders, error, status = get_trip_orders(
                trip.trip_id, other_driver.user_id
            )

            assert orders is None
            assert error == "You can only view orders for your own trips"
            assert status == 403

    def test_get_trip_orders_not_found(self, app):
        """Get orders for non-existent trip."""
        with app.app_context():
            driver = _make_user("driver@example.com", UserRole.DRIVER)

            orders, error, status = get_trip_orders(99999, driver.user_id)

            assert orders is None
            assert error == "Trip not found"
            assert status == 404


class TestCascadeOrderStatusHelper:
    """Service-level tests for _cascade_order_status function."""

    def test_cascade_order_status(self, app):
        """Verify _cascade_order_status updates orders correctly."""
        with app.app_context():
            driver = _make_user("driver@example.com", UserRole.DRIVER)
            shopper = _make_user("shopper@example.com", UserRole.SHOPPER)
            trip, _, _ = _make_open_trip_with_items(driver)

            order1 = Order(shopper_id=shopper.user_id, trip_id=trip.trip_id)
            order1.status = OrderStatus.CLAIMED
            order2 = Order(shopper_id=shopper.user_id, trip_id=trip.trip_id)
            order2.status = OrderStatus.CLAIMED
            order3 = Order(shopper_id=shopper.user_id, trip_id=trip.trip_id)
            order3.status = OrderStatus.PURCHASED
            db.session.add_all([order1, order2, order3])
            db.session.commit()

            _cascade_order_status(
                trip.trip_id,
                OrderStatus.CLAIMED,
                OrderStatus.PURCHASED,
            )
            db.session.commit()

            updated_order1 = db.session.get(Order, order1.order_id)
            updated_order2 = db.session.get(Order, order2.order_id)
            updated_order3 = db.session.get(Order, order3.order_id)

            assert updated_order1.status == OrderStatus.PURCHASED
            assert updated_order2.status == OrderStatus.PURCHASED
            assert updated_order3.status == OrderStatus.PURCHASED
