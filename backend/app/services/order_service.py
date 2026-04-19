from sqlalchemy.exc import SQLAlchemyError

from app.extensions import db
from app.models import Item, Order, OrderItem, Trip
from app.models.enums import OrderStatus, TripStatus, NotificationType
from app.services.notification_service import create_notification


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
    Create or update a shopper order against one open trip.

    Args:
        shopper_id: The authenticated shopper's primary key.
        data: Dict with trip_id and item claims.

    Returns:
        tuple: (Order, None, 201) when a new order is created,
            (Order, None, 200) when an existing order is updated,
            or (None, error_message, status_code) on failure.
    """
    trip_id = data.get("trip_id")
    items_data = data.get("items", [])

    if not trip_id or not items_data:
        return None, "Trip ID and items are required", 400

    trip = db.session.get(Trip, trip_id)
    if not trip:
        return None, "Trip not found", 404

    if trip.status != TripStatus.OPEN:
        return None, "Trip is not accepting claims", 409

    if trip.driver_id == shopper_id:
        return None, "You cannot claim items from your own trip", 403

    existing_order = (
        Order.query.filter_by(shopper_id=shopper_id, trip_id=trip_id)
        .filter(Order.status != OrderStatus.CANCELLED)
        .first()
    )

    claimed_quantities = {}
    for claimed_item in items_data:
        item_id = claimed_item.get("item_id")
        quantity = claimed_item.get("quantity")

        if not item_id or quantity is None:
            return None, "Each claimed item requires item_id and quantity", 400

        try:
            quantity = int(quantity)
        except (TypeError, ValueError):
            return None, "Quantity must be an integer", 400

        if quantity <= 0:
            return None, "Quantity must be greater than zero", 400

        claimed_quantities[item_id] = (
            claimed_quantities.get(item_id, 0) + quantity
        )

    claimed_items = []
    for item_id, quantity in claimed_quantities.items():
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
        status = 200 if existing_order else 201
        order = existing_order
        if not order:
            order = Order(shopper_id=shopper_id, trip_id=trip.trip_id)
            db.session.add(order)

        existing_lines = {
            order_item.item_id: order_item for order_item in order.order_items
        }

        for item, quantity in claimed_items:
            order_item = existing_lines.get(item.item_id)
            if order_item:
                order_item.quantity += quantity
            else:
                order.order_items.append(
                    OrderItem(
                        item_id=item.item_id,
                        quantity=quantity,
                    )
                )

            item.claimed_quantity += quantity

        if status == 201:
            create_notification(
                user_id=trip.driver_id,
                notification_type=NotificationType.ITEMS_CLAIMED,
                message=(
                    f"A shopper claimed items from your "
                    f"{trip.store_name} trip."
                ),
                related_trip_id=trip.trip_id,
                related_order_id=order.order_id,
            )

        db.session.commit()
        return order, None, status
    except SQLAlchemyError:
        db.session.rollback()
        return None, "Failed to create order", 500


def cancel_order(order_id, shopper_id):
    """
    Cancel a shopper's claimed order and revert inventory.

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

    if order.status != OrderStatus.CLAIMED:
        return None, "Only claimed orders can be cancelled", 409

    for order_item in order.order_items:
        item = db.session.get(Item, order_item.item_id)
        if not item:
            continue
        item.claimed_quantity = max(0, item.claimed_quantity - order_item.quantity)

    order.status = OrderStatus.CANCELLED

    try:
        db.session.commit()
        return order, None, 200
    except SQLAlchemyError:
        db.session.rollback()
        return None, "Failed to cancel order", 500


def complete_order(order_id, shopper_id):
    """
    Mark a shopper's ready-for-pickup order as completed.

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

    if order.status != OrderStatus.READY_FOR_PICKUP:
        return None, "Order is not ready for pickup", 409

    order.status = OrderStatus.COMPLETED

    try:
        db.session.commit()
        return order, None, 200
    except SQLAlchemyError:
        db.session.rollback()
        return None, "Failed to update order", 500
