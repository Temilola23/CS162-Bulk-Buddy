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
    payload, error, status = get_current_user_profile(current_user.user_id)
    if error:
        return jsonify({"message": error}), status

    return jsonify(payload), status


@me.route("/me", methods=["PUT"])
@login_required
def update_me():
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
