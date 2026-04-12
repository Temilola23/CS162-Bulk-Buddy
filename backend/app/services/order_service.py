from sqlalchemy.exc import SQLAlchemyError

from app.extensions import db
from app.models import Item, Order, OrderItem, Trip
from app.models.enums import OrderStatus, TripStatus


def list_shopper_orders(shopper_id, status_filter=None):
    """
    Return all orders belonging to the authenticated shopper.

    Args:
        shopper_id: The shopper's primary key.
        status_filter: Optional status string to filter by.

    Returns:
        tuple: (orders, None, 200) on success, or
            (None, error_message, 400) on invalid status.
    """
    if status_filter:
        try:
            status_enum = OrderStatus(status_filter)
        except ValueError:
            return None, f"Invalid status: {status_filter}", 400

    query = Order.query.filter_by(shopper_id=shopper_id)
    if status_filter:
        query = query.filter_by(status=status_enum)

    orders = (
        query.join(Trip, Order.trip_id == Trip.trip_id)
        .order_by(Trip.pickup_time.desc(), Order.created_at.desc())
        .all()
    )
    return orders, None, 200


def create_order(shopper_id, data):
    """
    Create a shopper order against one open trip.

    Args:
        shopper_id: The authenticated shopper's primary key.
        data: Dict with trip_id and item claims.

    Returns:
        tuple: (Order, None, 201) on success, or
            (None, error_message, status_code) on failure.
    """
    trip_id = data.get("trip_id")
    items_data = data.get("items", [])

    if not trip_id or not items_data:
        return None, "trip_id and items are required", 400

    trip = db.session.get(Trip, trip_id)
    if not trip:
        return None, "Trip not found", 404

    if trip.status != TripStatus.OPEN:
        return None, "Trip is not accepting claims", 409

    existing = (
        Order.query.filter_by(shopper_id=shopper_id, trip_id=trip_id)
        .filter(Order.status != OrderStatus.CANCELLED)
        .first()
    )
    if existing:
        return None, "You already have an active order for this trip", 409

    claimed_items = []
    for claimed_item in items_data:
        item_id = claimed_item.get("item_id")
        quantity = claimed_item.get("quantity")

        if not item_id or quantity is None:
            return None, "Each claimed item requires item_id and quantity", 400

        try:
            quantity = int(quantity)
        except (TypeError, ValueError):
            return None, "quantity must be an integer", 400

        if quantity <= 0:
            return None, "quantity must be greater than zero", 400

        item = db.session.get(Item, item_id)
        if not item or item.trip_id != trip.trip_id:
            return None, "Item does not belong to this trip", 400

        if quantity > item.available_quantity:
            return (
                None,
                f"Not enough quantity available for {item.name}",
                409,
            )

        claimed_items.append((item, quantity))

    try:
        order = Order(shopper_id=shopper_id, trip_id=trip.trip_id)
        db.session.add(order)
        db.session.flush()

        for item, quantity in claimed_items:
            db.session.add(
                OrderItem(
                    order_id=order.order_id,
                    item_id=item.item_id,
                    quantity=quantity,
                )
            )
            item.claimed_quantity += quantity

        db.session.commit()
        return order, None, 201
    except SQLAlchemyError:
        db.session.rollback()
        return None, "Failed to create order", 500


def complete_order(order_id, shopper_id):
    """
    Mark a shopper's order as completed.

    Args:
        order_id: The order primary key.
        shopper_id: The authenticated shopper's primary key.

    Returns:
        tuple: (Order, None, 200) on success, or
            (None, error_message, status_code) on failure.
    """
    order = db.session.get(Order, order_id)
    if not order:
        return None, "Order not found", 404

    if order.shopper_id != shopper_id:
        return None, "You can only update your own orders", 403

    if order.status == OrderStatus.CANCELLED:
        return None, "Cannot complete a cancelled order", 409

    if order.status == OrderStatus.COMPLETED:
        return order, None, 200

    order.status = OrderStatus.COMPLETED

    try:
        db.session.commit()
        return order, None, 200
    except SQLAlchemyError:
        db.session.rollback()
        return None, "Failed to update order", 500
