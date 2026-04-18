from datetime import datetime, timedelta, timezone

from werkzeug.security import generate_password_hash

from app.extensions import db
from app.models import Item, Order, OrderItem, Trip, User
from app.models.enums import TripStatus, UserRole
from app.services.order_service import create_order


def _make_user(email, role):
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


class TestCreateOrderService:
    """Service-level tests for creating and extending shopper orders."""

    def test_create_order_updates_existing_order_for_trip(self, app):
        """Items from a trip with an active order update that order."""
        with app.app_context():
            driver = _make_user("driver@example.com", UserRole.DRIVER)
            shopper = _make_user("shopper@example.com", UserRole.SHOPPER)
            trip, paper_towels, olive_oil = _make_open_trip_with_items(driver)

            existing_order = Order(
                shopper_id=shopper.user_id,
                trip_id=trip.trip_id,
            )
            db.session.add(existing_order)
            db.session.flush()
            db.session.add(
                OrderItem(
                    order_id=existing_order.order_id,
                    item_id=paper_towels.item_id,
                    quantity=1,
                )
            )
            paper_towels.claimed_quantity = 1
            db.session.commit()

            order, error, status = create_order(
                shopper.user_id,
                {
                    "trip_id": trip.trip_id,
                    "items": [
                        {"item_id": paper_towels.item_id, "quantity": 2},
                        {"item_id": olive_oil.item_id, "quantity": 1},
                    ],
                },
            )

            assert error is None
            assert status == 200
            assert order.order_id == existing_order.order_id
            assert Order.query.count() == 1

            order_items = {
                order_item.item_id: order_item
                for order_item in OrderItem.query.filter_by(
                    order_id=existing_order.order_id
                ).all()
            }
            assert order_items[paper_towels.item_id].quantity == 3
            assert order_items[olive_oil.item_id].quantity == 1
            assert (
                db.session.get(Item, paper_towels.item_id).claimed_quantity
                == 3
            )
            assert (
                db.session.get(Item, olive_oil.item_id).claimed_quantity == 1
            )

    def test_create_order_creates_order_when_trip_has_no_existing_order(
        self, app
    ):
        """Items from a new trip create the shopper's first order."""
        with app.app_context():
            driver = _make_user("new-driver@example.com", UserRole.DRIVER)
            shopper = _make_user("new-shopper@example.com", UserRole.SHOPPER)
            trip, paper_towels, _olive_oil = _make_open_trip_with_items(driver)

            order, error, status = create_order(
                shopper.user_id,
                {
                    "trip_id": trip.trip_id,
                    "items": [
                        {"item_id": paper_towels.item_id, "quantity": 2}
                    ],
                },
            )

            assert error is None
            assert status == 201
            assert order.shopper_id == shopper.user_id
            assert order.trip_id == trip.trip_id
            assert Order.query.count() == 1

            order_item = OrderItem.query.one()
            assert order_item.order_id == order.order_id
            assert order_item.item_id == paper_towels.item_id
            assert order_item.quantity == 2
            assert (
                db.session.get(Item, paper_towels.item_id).claimed_quantity
                == 2
            )
