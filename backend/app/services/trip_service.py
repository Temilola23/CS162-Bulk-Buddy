from datetime import datetime

from sqlalchemy.exc import SQLAlchemyError

from app.extensions import db
from app.models import Trip, Item, Order, User
from app.models.enums import (
    UserRole,
    TripStatus,
    OrderStatus,
)


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


def get_open_trips():
    """
    Return all trips with OPEN status.

    Returns:
        list: List of Trip objects with status OPEN.
    """
    return Trip.query.filter_by(status=TripStatus.OPEN).all()


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


def complete_trip(trip_id, driver_id):
    """
    Complete a trip (CLOSED -> COMPLETED).

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

    if trip.status != TripStatus.CLOSED:
        return None, "Can only complete CLOSED trips", 409

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

    trip.status = TripStatus.CANCELLED

    # Cascade: cancel all orders on this trip
    orders = Order.query.filter_by(trip_id=trip_id).all()
    for order in orders:
        order.status = OrderStatus.CANCELLED

    try:
        db.session.commit()
        return trip, None, 200
    except SQLAlchemyError:
        db.session.rollback()
        return None, "Failed to cancel trip", 500
