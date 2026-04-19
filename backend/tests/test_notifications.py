from datetime import datetime, timedelta, timezone

from app.extensions import db
from app.models import (
    Item,
    Notification,
    Order,
    OrderItem,
    Trip,
    User,
)
from app.models.enums import (
    NotificationType,
    TripStatus,
    UserRole,
)
from werkzeug.security import generate_password_hash


def _make_driver(db_session, email="driver@example.com"):
    """Create and persist a driver user for tests."""
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
    """Create and persist a shopper user for tests."""
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
    """Create a claimable trip and one item."""
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


class TestNotificationsRoutes:
    """Tests for notification endpoints."""

    def test_get_notifications_requires_login(self, client):
        """Unauthenticated notification requests should return 401."""
        response = client.get("/api/me/notifications")

        assert response.status_code == 401

    def test_get_notifications_returns_empty_list(self, client, app):
        """A user with no notifications should get an empty list."""
        with app.app_context():
            shopper = _make_shopper(db, email="empty@example.com")
            _login(client, shopper.email)

        response = client.get("/api/me/notifications")

        assert response.status_code == 200
        assert response.json["notifications"] == []

    def test_get_notifications_returns_user_notifications(
        self, client, app
    ):
        """Get notifications should return the logged-in user's
        notifications."""
        with app.app_context():
            shopper = _make_shopper(db, email="notif@example.com")
            notif = Notification(
                user_id=shopper.user_id,
                type=NotificationType.ORDER_CANCELLED,
                message="Your order was cancelled",
            )
            db.session.add(notif)
            db.session.commit()
            _login(client, shopper.email)

        response = client.get("/api/me/notifications")

        assert response.status_code == 200
        assert len(response.json["notifications"]) == 1
        assert (
            response.json["notifications"][0]["message"]
            == "Your order was cancelled"
        )
        assert response.json["notifications"][0]["type"] == "order_cancelled"

    def test_get_unread_count_requires_login(self, client):
        """Unauthenticated unread count requests should return 401."""
        response = client.get("/api/me/notifications/unread-count")

        assert response.status_code == 401

    def test_get_unread_count_returns_zero(self, client, app):
        """A user with no unread notifications should get count 0."""
        with app.app_context():
            shopper = _make_shopper(db, email="zero-count@example.com")
            _login(client, shopper.email)

        response = client.get("/api/me/notifications/unread-count")

        assert response.status_code == 200
        assert response.json["unread_count"] == 0

    def test_get_unread_count_returns_correct_count(self, client, app):
        """Unread count should reflect only unread notifications."""
        with app.app_context():
            shopper = _make_shopper(db, email="count@example.com")
            db.session.add_all([
                Notification(
                    user_id=shopper.user_id,
                    type=NotificationType.ORDER_CANCELLED,
                    message="First",
                    is_read=False,
                ),
                Notification(
                    user_id=shopper.user_id,
                    type=NotificationType.ITEMS_CLAIMED,
                    message="Second",
                    is_read=False,
                ),
                Notification(
                    user_id=shopper.user_id,
                    type=NotificationType.TRIP_UPDATE,
                    message="Third",
                    is_read=True,
                ),
            ])
            db.session.commit()
            _login(client, shopper.email)

        response = client.get("/api/me/notifications/unread-count")

        assert response.status_code == 200
        assert response.json["unread_count"] == 2

    def test_mark_as_read_requires_login(self, client):
        """Marking as read requires authentication."""
        response = client.patch("/api/me/notifications/1/read")

        assert response.status_code == 401

    def test_mark_as_read_success(self, client, app):
        """A user can mark their own notification as read."""
        with app.app_context():
            shopper = _make_shopper(db, email="mark-read@example.com")
            notif = Notification(
                user_id=shopper.user_id,
                type=NotificationType.ORDER_CANCELLED,
                message="Test",
                is_read=False,
            )
            db.session.add(notif)
            db.session.commit()
            notif_id = notif.notification_id
            _login(client, shopper.email)

        response = client.patch(f"/api/me/notifications/{notif_id}/read")

        assert response.status_code == 200
        assert response.json["notification"]["is_read"] is True

    def test_mark_as_read_rejects_missing_notification(
        self, client, app
    ):
        """Marking a missing notification as read should return 404."""
        with app.app_context():
            shopper = _make_shopper(db, email="missing-notif@example.com")
            _login(client, shopper.email)

        response = client.patch("/api/me/notifications/9999/read")

        assert response.status_code == 404
        assert response.json["error"] == "Notification not found"

    def test_mark_as_read_rejects_other_user_notification(
        self, client, app
    ):
        """Users cannot mark other users' notifications as read."""
        with app.app_context():
            shopper1 = _make_shopper(db, email="user1@example.com")
            shopper2 = _make_shopper(db, email="user2@example.com")
            notif = Notification(
                user_id=shopper1.user_id,
                type=NotificationType.ORDER_CANCELLED,
                message="Not yours",
            )
            db.session.add(notif)
            db.session.commit()
            notif_id = notif.notification_id
            _login(client, shopper2.email)

        response = client.patch(f"/api/me/notifications/{notif_id}/read")

        assert response.status_code == 403
        assert response.json["error"] == "Not your notification"

    def test_mark_all_as_read_requires_login(self, client):
        """Marking all as read requires authentication."""
        response = client.patch("/api/me/notifications/read-all")

        assert response.status_code == 401

    def test_mark_all_as_read_success(self, client, app):
        """A user can mark all their notifications as read."""
        with app.app_context():
            shopper = _make_shopper(db, email="mark-all@example.com")
            db.session.add_all([
                Notification(
                    user_id=shopper.user_id,
                    type=NotificationType.ORDER_CANCELLED,
                    message="First",
                    is_read=False,
                ),
                Notification(
                    user_id=shopper.user_id,
                    type=NotificationType.ITEMS_CLAIMED,
                    message="Second",
                    is_read=False,
                ),
            ])
            db.session.commit()
            _login(client, shopper.email)

        response = client.patch("/api/me/notifications/read-all")

        assert response.status_code == 200

        with app.app_context():
            unread = Notification.query.filter_by(
                user_id=shopper.user_id,
                is_read=False,
            ).count()
            assert unread == 0


class TestNotificationsTriggers:
    """Tests for notification creation via service functions."""

    def test_notification_created_on_trip_cancellation(self, client, app):
        """Cancelling a trip creates notifications for affected shoppers."""
        with app.app_context():
            driver = _make_driver(db)
            shopper = _make_shopper(db, email="trip-cancel@example.com")
            trip, item = _make_open_trip_with_item(db, driver)

            order = Order(shopper_id=shopper.user_id, trip_id=trip.trip_id)
            db.session.add(order)
            db.session.flush()
            db.session.add(
                OrderItem(
                    order_id=order.order_id,
                    item_id=item.item_id,
                    quantity=1,
                )
            )
            item.claimed_quantity = 1
            db.session.commit()

            trip_id = trip.trip_id
            shopper_id = shopper.user_id
            _login(client, driver.email)

        from app.services import cancel_trip
        with app.app_context():
            _, error, status = cancel_trip(trip_id, driver.user_id)

        assert error is None
        assert status == 200

        with app.app_context():
            notif = Notification.query.filter_by(
                user_id=shopper_id,
                type=NotificationType.ORDER_CANCELLED,
            ).first()
            assert notif is not None
            assert "Costco" in notif.message
            assert "cancelled" in notif.message.lower()
            assert notif.related_trip_id == trip_id

    def test_notification_created_on_order_creation(self, client, app):
        """Creating an order creates a notification for the driver."""
        with app.app_context():
            driver = _make_driver(db)
            shopper = _make_shopper(db, email="order-create@example.com")
            trip, item = _make_open_trip_with_item(db, driver)
            trip_id = trip.trip_id
            item_id = item.item_id
            driver_id = driver.user_id
            _login(client, shopper.email)

        response = client.post(
            "/api/me/orders",
            json={
                "trip_id": trip_id,
                "items": [{"item_id": item_id, "quantity": 1}],
            },
        )

        assert response.status_code == 201

        with app.app_context():
            notif = Notification.query.filter_by(
                user_id=driver_id,
                type=NotificationType.ITEMS_CLAIMED,
            ).first()
            assert notif is not None
            assert "claimed" in notif.message.lower()
            assert "Costco" in notif.message
            assert notif.related_trip_id == trip_id

    def test_notification_not_created_on_order_update(self, client, app):
        """Updating an existing order should not create another
        notification."""
        with app.app_context():
            driver = _make_driver(db)
            shopper = _make_shopper(db, email="order-update@example.com")
            trip, item = _make_open_trip_with_item(db, driver)
            trip_id = trip.trip_id
            item_id = item.item_id
            driver_id = driver.user_id

            order = Order(shopper_id=shopper.user_id, trip_id=trip.trip_id)
            db.session.add(order)
            db.session.flush()
            db.session.add(
                OrderItem(
                    order_id=order.order_id,
                    item_id=item.item_id,
                    quantity=1,
                )
            )
            item.claimed_quantity = 1
            db.session.commit()
            _login(client, shopper.email)

        response = client.post(
            "/api/me/orders",
            json={
                "trip_id": trip_id,
                "items": [{"item_id": item_id, "quantity": 1}],
            },
        )

        assert response.status_code == 200

        with app.app_context():
            notif_count = Notification.query.filter_by(
                user_id=driver_id,
                type=NotificationType.ITEMS_CLAIMED,
            ).count()
            assert notif_count == 0
