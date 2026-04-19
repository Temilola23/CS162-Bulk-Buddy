from flask import Blueprint, jsonify, request
from flask_login import current_user, login_required

from app.services import (
    cancel_order,
    complete_order,
    create_order,
    get_current_user_profile,
    get_notifications,
    get_unread_count,
    list_shopper_orders,
    mark_all_as_read,
    mark_as_read,
    update_current_user_profile,
)

me = Blueprint("me", __name__, url_prefix="/api")


@me.route("/me", methods=["GET"])
@login_required
def get_me():
    """
    Return the authenticated user's profile payload.

    The response includes both the core user record and the latest driver
    application so the frontend can render the profile/settings surfaces
    without making separate API calls.

    Returns:
        Response: JSON ``{"user": ..., "driver_application": ...}``
            with HTTP 200 on success, or an error payload when the current
            user cannot be resolved.
    """
    payload, error, status = get_current_user_profile(current_user.user_id)
    if error:
        return jsonify({"message": error}), status

    return jsonify(payload), status


@me.route("/me", methods=["PUT"])
@login_required
def update_me():
    """
    Update editable fields for the authenticated user.

    Expects a JSON body containing any subset of the editable current-user
    profile fields handled by ``update_current_user_profile``.

    Returns:
        Response: JSON ``{"user": ..., "driver_application": ...}``
            with HTTP 200 on success, or an error payload when validation
            or persistence fails.
    """
    payload, error, status = update_current_user_profile(
        current_user.user_id,
        request.get_json() or {},
    )
    if error:
        return jsonify({"message": error}), status

    return jsonify(payload), status


@me.route("/me/orders", methods=["GET"])
@login_required
def list_orders():
    """
    List every order belonging to the authenticated shopper.

    Returns:
        Response: JSON ``{"orders": [<order_dict>, ...]}`` with HTTP 200.
            Each order includes nested trip and order-item data because the
            frontend order history and trip-detail pages need both.
    """
    orders, error, status = list_shopper_orders(
        current_user.user_id, status_filter=request.args.get("status")
    )
    if error:
        return jsonify({"message": error}), status

    return (
        jsonify(
            {
                "orders": [
                    order.to_dict(
                        include_trip=True,
                        include_order_items=True,
                    )
                    for order in orders
                ]
            }
        ),
        status,
    )


@me.route("/me/orders", methods=["POST"])
@login_required
def create_order_route():
    """
    Create or update an order for the authenticated shopper.

    Expects a JSON body with ``trip_id`` plus a list of claimed item
    quantities. If the shopper already has an active order for the trip,
    the requested quantities are added to that order. The heavy validation
    and transaction logic lives in ``create_order``.

    Returns:
        Response: JSON ``{"message": ..., "order": <order_dict>}``
            with HTTP 201 on success, or an error payload when validation
            or inventory checks fail.
    """
    order, error, status = create_order(
        current_user.user_id, request.get_json() or {}
    )
    if error:
        return jsonify({"message": error}), status

    message = (
        "Order updated successfully"
        if status == 200
        else "Order created successfully"
    )

    return (
        jsonify(
            {
                "message": message,
                "order": order.to_dict(
                    include_trip=True,
                    include_order_items=True,
                ),
            }
        ),
        status,
    )


@me.route("/me/orders/<int:order_id>/cancel", methods=["PATCH"])
@login_required
def cancel_order_route(order_id):
    """
    Cancel one of the authenticated shopper's claimed orders.

    Reverts claimed inventory so other shoppers can claim the freed
    quantities.

    Args:
        order_id (int): Primary key of the order to cancel, extracted from
            the URL path.

    Returns:
        Response: JSON ``{"message": ..., "order": <order_dict>}``
            with HTTP 200 on success, or an error payload when the order is
            missing, belongs to another shopper, or cannot be cancelled.
    """
    order, error, status = cancel_order(order_id, current_user.user_id)
    if error:
        return jsonify({"message": error}), status

    return (
        jsonify(
            {
                "message": "Order cancelled successfully",
                "order": order.to_dict(
                    include_trip=True,
                    include_order_items=True,
                ),
            }
        ),
        status,
    )


@me.route("/me/orders/<int:order_id>/complete", methods=["PATCH"])
@login_required
def complete_order_route(order_id):
    """
    Mark one of the authenticated shopper's ready-for-pickup orders as
    completed.

    Args:
        order_id (int): Primary key of the order to update, extracted from
            the URL path.

    Returns:
        Response: JSON ``{"message": ..., "order": <order_dict>}``
            with HTTP 200 on success, or an error payload when the order is
            missing, belongs to another shopper, or cannot transition.
    """
    order, error, status = complete_order(order_id, current_user.user_id)
    if error:
        return jsonify({"message": error}), status

    return (
        jsonify(
            {
                "message": "Order completed successfully",
                "order": order.to_dict(
                    include_trip=True,
                    include_order_items=True,
                ),
            }
        ),
        status,
    )


@me.route("/me/notifications", methods=["GET"])
@login_required
def get_notifications_route():
    """Get notifications for the authenticated user."""
    notifications, error, status = get_notifications(current_user.user_id)
    if error:
        return jsonify({"error": error}), status
    return jsonify({"notifications": notifications}), status


@me.route("/me/notifications/unread-count", methods=["GET"])
@login_required
def get_unread_count_route():
    """Get unread notification count."""
    result, error, status = get_unread_count(current_user.user_id)
    if error:
        return jsonify({"error": error}), status
    return jsonify(result), status


@me.route("/me/notifications/<int:notification_id>/read", methods=["PATCH"])
@login_required
def mark_notification_read_route(notification_id):
    """Mark a notification as read."""
    result, error, status = mark_as_read(notification_id, current_user.user_id)
    if error:
        return jsonify({"error": error}), status
    return jsonify({"notification": result}), status


@me.route("/me/notifications/read-all", methods=["PATCH"])
@login_required
def mark_all_read_route():
    """Mark all notifications as read."""
    _, error, status = mark_all_as_read(current_user.user_id)
    if error:
        return jsonify({"error": error}), status
    return jsonify({"message": "All notifications marked as read"}), status
