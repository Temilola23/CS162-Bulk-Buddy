from flask import Blueprint, jsonify, request
from flask_login import login_required, current_user

from app.services import (
    cancel_trip,
    close_trip,
    complete_trip,
    create_trip,
    get_driver_trips,
    get_open_trips,
    get_trip,
    update_trip,
)

trip = Blueprint("trip", __name__, url_prefix="/api")


def _serialize_item(item):
    """Convert an Item model to a JSON-safe dict."""
    return {
        "item_id": item.item_id,
        "name": item.name,
        "unit": item.unit,
        "total_quantity": item.total_quantity,
        "claimed_quantity": item.claimed_quantity,
        "available_quantity": item.available_quantity,
        "price_per_unit": item.price_per_unit,
    }


def _serialize_trip(trip_obj, include_items=False):
    """Convert a Trip model to a JSON-safe dict."""
    data = {
        "trip_id": trip_obj.trip_id,
        "driver_id": trip_obj.driver_id,
        "store_name": trip_obj.store_name,
        "pickup_location_text": trip_obj.pickup_location_text,
        "pickup_lat": trip_obj.pickup_lat,
        "pickup_lng": trip_obj.pickup_lng,
        "pickup_time": trip_obj.pickup_time.isoformat(),
        "status": trip_obj.status.value,
        "created_at": trip_obj.created_at.isoformat(),
        "updated_at": trip_obj.updated_at.isoformat(),
    }
    if include_items:
        data["items"] = [_serialize_item(i) for i in trip_obj.items]
    return data


@trip.route("/trips", methods=["POST"])
@login_required
def create():
    """Create a new trip with items."""
    data = request.get_json() or {}

    trip_obj, error, status = create_trip(current_user.user_id, data)

    if error:
        return jsonify({"message": error}), status

    return (
        jsonify(
            {
                "message": "Trip created successfully",
                "trip": _serialize_trip(trip_obj, include_items=True),
            }
        ),
        201,
    )


@trip.route("/trips", methods=["GET"])
@login_required
def list_open():
    """List all open trips (the trip feed)."""
    trips = get_open_trips()
    return jsonify({"trips": [_serialize_trip(t) for t in trips]}), 200


@trip.route("/trips/<int:trip_id>", methods=["GET"])
@login_required
def get_one(trip_id):
    """Get a single trip with its items."""
    trip_obj = get_trip(trip_id)
    if not trip_obj:
        return jsonify({"message": "Trip not found"}), 404

    return (
        jsonify({"trip": _serialize_trip(trip_obj, include_items=True)}),
        200,
    )


@trip.route("/me/trips", methods=["GET"])
@login_required
def my_trips():
    """List all trips for the current driver."""
    trips = get_driver_trips(current_user.user_id)
    return jsonify({"trips": [_serialize_trip(t) for t in trips]}), 200


@trip.route("/trips/<int:trip_id>", methods=["PUT"])
@login_required
def edit(trip_id):
    """Update an OPEN trip's details."""
    data = request.get_json() or {}

    trip_obj, error, status = update_trip(trip_id, current_user.user_id, data)

    if error:
        return jsonify({"message": error}), status

    return (
        jsonify(
            {
                "message": "Trip updated successfully",
                "trip": _serialize_trip(trip_obj, include_items=True),
            }
        ),
        200,
    )


@trip.route("/trips/<int:trip_id>/close", methods=["PATCH"])
@login_required
def close(trip_id):
    """Close a trip (OPEN -> CLOSED)."""
    trip_obj, error, status = close_trip(trip_id, current_user.user_id)

    if error:
        return jsonify({"message": error}), status

    return (
        jsonify(
            {
                "message": "Trip closed successfully",
                "trip": _serialize_trip(trip_obj),
            }
        ),
        200,
    )


@trip.route("/trips/<int:trip_id>/complete", methods=["PATCH"])
@login_required
def complete(trip_id):
    """Complete a trip (CLOSED -> COMPLETED)."""
    trip_obj, error, status = complete_trip(trip_id, current_user.user_id)

    if error:
        return jsonify({"message": error}), status

    return (
        jsonify(
            {
                "message": "Trip completed successfully",
                "trip": _serialize_trip(trip_obj),
            }
        ),
        200,
    )


@trip.route("/trips/<int:trip_id>/cancel", methods=["PATCH"])
@login_required
def cancel(trip_id):
    """Cancel a trip and cascade to orders."""
    trip_obj, error, status = cancel_trip(trip_id, current_user.user_id)

    if error:
        return jsonify({"message": error}), status

    return (
        jsonify(
            {
                "message": "Trip cancelled successfully",
                "trip": _serialize_trip(trip_obj),
            }
        ),
        200,
    )
