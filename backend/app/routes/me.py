from flask import Blueprint, jsonify, request
from flask_login import current_user, login_required

from app.services import (
    complete_order,
    create_order,
    get_current_user_profile,
    list_shopper_orders,
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
    orders = list_shopper_orders(current_user.user_id)
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
        200,
    )


@me.route("/me/orders", methods=["POST"])
@login_required
def create_order_route():
    """
    Create a new order for the authenticated shopper.

    Expects a JSON body with ``trip_id`` plus a list of claimed item
    quantities. The heavy validation and transaction logic lives in
    ``create_order``.

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

    return (
        jsonify(
            {
                "message": "Order created successfully",
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
    Mark one of the authenticated shopper's orders as completed.

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
