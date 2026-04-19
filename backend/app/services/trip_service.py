from datetime import datetime

from sqlalchemy.exc import SQLAlchemyError

from app.extensions import db
from app.models import Trip, Item, Order, User
from app.models.enums import (
    UserRole,
    TripStatus,
    OrderStatus,
    NotificationType,
)
from app.services.notification_service import create_notification


def _cascade_order_status(trip_id, expected_order_status, next_order_status):
    """Apply a trip-driven status to orders in the expected prior state."""
    orders = Order.query.filter_by(
        trip_id=trip_id,
        status=expected_order_status,
    ).all()
    for order in orders:
        order.status = next_order_status


TRIP_STATUS_TO_ORDER_STATUS = {
    TripStatus.OPEN: OrderStatus.CLAIMED,
    TripStatus.CLOSED: OrderStatus.CLAIMED,
    TripStatus.PURCHASED: OrderStatus.PURCHASED,
    TripStatus.READY_FOR_PICKUP: OrderStatus.READY_FOR_PICKUP,
}


def create_trip(driver_id, data):
    """
    Create a new trip with items.

    Args:
        driver_id: The driver's user ID.
        data: Dict with store_name, pickup_location_text,
            pickup_lat, pickup_lng, pickup_time, and items list.

    Returns:
        tuple: (Trip, None, 201) on success, or
            (None, error_message, status_code) on failure.
    """
    user = db.session.get(User, driver_id)
    if not user or user.role != UserRole.DRIVER:
        return None, "Only drivers can create trips", 403

    store_name = data.get("store_name")
    pickup_location_text = data.get("pickup_location_text")
    pickup_time = data.get("pickup_time")
    items_data = data.get("items", [])

    if not store_name or not pickup_location_text or not pickup_time:
        return (
            None,
            "store_name, pickup_location_text, and pickup_time are required",
            400,
        )

    try:
        parsed_pickup_time = datetime.fromisoformat(pickup_time)
    except (ValueError, TypeError):
        return (
            None,
            "pickup_time must be a valid ISO 8601 datetime",
            400,
        )

    for item_data in items_data:
        required = ("name", "unit", "total_quantity")
        missing = [f for f in required if f not in item_data]
        if missing:
            return (
                None,
                f"Each item requires: name, unit, total_quantity. "
                f"Missing: {', '.join(missing)}",
                400,
            )

    try:
        trip = Trip(
            driver_id=driver_id,
            store_name=store_name,
            pickup_location_text=pickup_location_text,
            pickup_lat=data.get("pickup_lat"),
            pickup_lng=data.get("pickup_lng"),
            pickup_time=parsed_pickup_time,
        )
        db.session.add(trip)
        db.session.flush()

        for item_data in items_data:
            item = Item(
                trip_id=trip.trip_id,
                name=item_data["name"],
                unit=item_data["unit"],
                total_quantity=item_data["total_quantity"],
                price_per_unit=item_data.get("price_per_unit"),
            )
            db.session.add(item)

        db.session.commit()
        return trip, None, 201
    except SQLAlchemyError:
        db.session.rollback()
        return None, "Failed to create trip", 500


def get_open_trips(exclude_driver_id=None):
    """
    Return all trips with OPEN status.

    Args:
        exclude_driver_id: Optional user ID to omit from the results so
            drivers do not see their own trips in the shopper-facing feed.

    Returns:
        list: List of Trip objects with status OPEN.
    """
    query = Trip.query.filter_by(status=TripStatus.OPEN)
    if exclude_driver_id is not None:
        query = query.filter(Trip.driver_id != exclude_driver_id)

    return query.all()


def get_trip(trip_id):
    """
    Return a single trip by ID.

    Args:
        trip_id: The trip's primary key.

    Returns:
        Trip or None.
    """
    return db.session.get(Trip, trip_id)


def get_driver_trips(driver_id):
    """
    Return all trips for a given driver.

    Args:
        driver_id: The driver's user ID.

    Returns:
        list: List of Trip objects belonging to the driver.
    """
    return Trip.query.filter_by(driver_id=driver_id).all()


def update_trip(trip_id, driver_id, data):
    """
    Update an OPEN trip's details.

    Args:
        trip_id: The trip's primary key.
        driver_id: The requesting driver's user ID.
        data: Dict with fields to update.

    Returns:
        tuple: (Trip, None, 200) on success, or
            (None, error_message, status_code) on failure.
    """
    trip = db.session.get(Trip, trip_id)
    if not trip:
        return None, "Trip not found", 404

    if trip.driver_id != driver_id:
        return None, "You can only edit your own trips", 403

    if trip.status != TripStatus.OPEN:
        return None, "Can only edit OPEN trips", 409

    # Update scalar fields
    if "store_name" in data:
        trip.store_name = data["store_name"]
    if "pickup_location_text" in data:
        trip.pickup_location_text = data["pickup_location_text"]
    if "pickup_lat" in data:
        trip.pickup_lat = data["pickup_lat"]
    if "pickup_lng" in data:
        trip.pickup_lng = data["pickup_lng"]
    if "pickup_time" in data:
        try:
            trip.pickup_time = datetime.fromisoformat(data["pickup_time"])
        except (ValueError, TypeError):
            return (
                None,
                "pickup_time must be a valid ISO 8601 datetime",
                400,
            )

    # Update items if provided
    if "items" in data:
        for item_data in data["items"]:
            item_id = item_data.get("item_id")
            if item_id:
                item = db.session.get(Item, item_id)
                if item and item.trip_id == trip.trip_id:
                    new_qty = item_data.get(
                        "total_quantity", item.total_quantity
                    )
                    if new_qty < item.claimed_quantity:
                        return (
                            None,
                            f"Cannot reduce quantity below "
                            f"claimed ({item.claimed_quantity})",
                            409,
                        )
                    item.total_quantity = new_qty
                    if "name" in item_data:
                        item.name = item_data["name"]
                    if "unit" in item_data:
                        item.unit = item_data["unit"]
                    if "price_per_unit" in item_data:
                        item.price_per_unit = item_data["price_per_unit"]

    try:
        db.session.commit()
        return trip, None, 200
    except SQLAlchemyError:
        db.session.rollback()
        return None, "Failed to update trip", 500


def close_trip(trip_id, driver_id):
    """
    Close a trip (OPEN -> CLOSED).

    Args:
        trip_id: The trip's primary key.
        driver_id: The requesting driver's user ID.

    Returns:
        tuple: (Trip, None, 200) on success, or
            (None, error_message, status_code) on failure.
    """
    trip = db.session.get(Trip, trip_id)
    if not trip:
        return None, "Trip not found", 404

    if trip.driver_id != driver_id:
        return None, "You can only close your own trips", 403

    if trip.status != TripStatus.OPEN:
        return None, "Can only close OPEN trips", 409

    trip.status = TripStatus.CLOSED

    try:
        db.session.commit()
        return trip, None, 200
    except SQLAlchemyError:
        db.session.rollback()
        return None, "Failed to close trip", 500


def mark_trip_purchased(trip_id, driver_id):
    """
    Mark a closed trip as purchased and cascade to its orders.

    Args:
        trip_id: The trip's primary key.
        driver_id: The requesting driver's user ID.

    Returns:
        tuple: (Trip, None, 200) on success, or
            (None, error_message, status_code) on failure.
    """
    trip = db.session.get(Trip, trip_id)
    if not trip:
        return None, "Trip not found", 404

    if trip.driver_id != driver_id:
        return None, "You can only mark your own trips as purchased", 403

    if trip.status != TripStatus.CLOSED:
        return None, "Can only mark CLOSED trips as purchased", 409

    trip.status = TripStatus.PURCHASED
    _cascade_order_status(
        trip_id,
        OrderStatus.CLAIMED,
        OrderStatus.PURCHASED,
    )

    try:
        db.session.commit()
        return trip, None, 200
    except SQLAlchemyError:
        db.session.rollback()
        return None, "Failed to mark trip as purchased", 500


def mark_trip_ready_for_pickup(trip_id, driver_id):
    """
    Mark a purchased trip ready for pickup and cascade to its orders.

    Args:
        trip_id: The trip's primary key.
        driver_id: The requesting driver's user ID.

    Returns:
        tuple: (Trip, None, 200) on success, or
            (None, error_message, status_code) on failure.
    """
    trip = db.session.get(Trip, trip_id)
    if not trip:
        return None, "Trip not found", 404

    if trip.driver_id != driver_id:
        return None, "You can only mark your own trips ready for pickup", 403

    if trip.status != TripStatus.PURCHASED:
        return None, "Can only mark PURCHASED trips ready for pickup", 409

    trip.status = TripStatus.READY_FOR_PICKUP
    _cascade_order_status(
        trip_id,
        OrderStatus.PURCHASED,
        OrderStatus.READY_FOR_PICKUP,
    )

    try:
        db.session.commit()
        return trip, None, 200
    except SQLAlchemyError:
        db.session.rollback()
        return None, "Failed to mark trip ready for pickup", 500


def complete_trip(trip_id, driver_id):
    """
    Complete a trip (READY_FOR_PICKUP -> COMPLETED).

    Args:
        trip_id: The trip's primary key.
        driver_id: The requesting driver's user ID.

    Returns:
        tuple: (Trip, None, 200) on success, or
            (None, error_message, status_code) on failure.
    """
    trip = db.session.get(Trip, trip_id)
    if not trip:
        return None, "Trip not found", 404

    if trip.driver_id != driver_id:
        return None, "You can only complete your own trips", 403

    if trip.status != TripStatus.READY_FOR_PICKUP:
        return None, "Can only complete READY_FOR_PICKUP trips", 409

    trip.status = TripStatus.COMPLETED

    try:
        db.session.commit()
        return trip, None, 200
    except SQLAlchemyError:
        db.session.rollback()
        return None, "Failed to complete trip", 500


def cancel_trip(trip_id, driver_id):
    """
    Cancel a trip and cascade to all its orders.

    Args:
        trip_id: The trip's primary key.
        driver_id: The requesting driver's user ID.

    Returns:
        tuple: (Trip, None, 200) on success, or
            (None, error_message, status_code) on failure.
    """
    trip = db.session.get(Trip, trip_id)
    if not trip:
        return None, "Trip not found", 404

    if trip.driver_id != driver_id:
        return None, "You can only cancel your own trips", 403

    if trip.status == TripStatus.COMPLETED:
        return None, "Cannot cancel a completed trip", 409

    if trip.status == TripStatus.CANCELLED:
        return None, "Trip already cancelled", 409

    expected_order_status = TRIP_STATUS_TO_ORDER_STATUS.get(trip.status)
    trip.status = TripStatus.CANCELLED

    if expected_order_status:
        _cascade_order_status(
            trip_id,
            expected_order_status,
            OrderStatus.CANCELLED,
        )

    cancelled_orders = Order.query.filter_by(
        trip_id=trip_id,
        status=OrderStatus.CANCELLED,
    ).all()
    for order in cancelled_orders:
        create_notification(
            user_id=order.shopper_id,
            notification_type=NotificationType.ORDER_CANCELLED,
            message=(
                f"Your order from {trip.store_name} was cancelled "
                f"because the driver cancelled the trip."
            ),
            related_trip_id=trip_id,
            related_order_id=order.order_id,
        )

    try:
        db.session.commit()
        return trip, None, 200
    except SQLAlchemyError:
        db.session.rollback()
        return None, "Failed to cancel trip", 500


def get_trip_orders(trip_id, driver_id):
    """
    Get all non-cancelled orders for a driver's trip.

    Args:
        trip_id: The trip's primary key.
        driver_id: The requesting driver's user ID.

    Returns:
        tuple: (list[dict], None, 200) on success, or
            (None, error_message, status_code) on failure.
    """
    trip = db.session.get(Trip, trip_id)
    if not trip:
        return None, "Trip not found", 404

    if trip.driver_id != driver_id:
        return None, "You can only view orders for your own trips", 403

    try:
        orders = (
            Order.query.filter_by(trip_id=trip_id)
            .filter(Order.status != OrderStatus.CANCELLED)
            .all()
        )
        result = []
        for order in orders:
            order_dict = order.to_dict(include_order_items=True)
            # Include shopper info (name + address for delivery)
            shopper = db.session.get(User, order.shopper_id)
            if shopper:
                order_dict["shopper"] = {
                    "name": shopper.full_name,
                    "address": (
                        f"{shopper.address_street}, {shopper.address_city}, "
                        f"{shopper.address_state} {shopper.address_zip}"
                    ),
                }
            result.append(order_dict)
        return result, None, 200
    except SQLAlchemyError:
        return None, "Failed to fetch trip orders", 500
