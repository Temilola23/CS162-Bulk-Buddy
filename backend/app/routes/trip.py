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


# ── Shared routes (any authenticated user) ──────────────────


@trip.route("/trips", methods=["GET"])
@login_required
def list_open():
    """
    List all open trips visible to any authenticated user.

    Returns:
        Response: JSON ``{"trips": [<trip_dict>, ...]}``
            with HTTP 200.  Each trip dict contains scalar
            fields only (no nested items).
    """
    trips = get_open_trips()
    return (
        jsonify({"trips": [t.to_dict() for t in trips]}),
        200,
    )


@trip.route("/trips/<int:trip_id>", methods=["GET"])
@login_required
def get_one(trip_id):
    """
    Get a single trip with its items.

    Args:
        trip_id (int): Primary key of the requested trip,
            extracted from the URL path.

    Returns:
        Response: JSON ``{"trip": <trip_dict>}`` with HTTP
            200, where ``trip_dict`` includes a nested
            ``items`` list.  Returns HTTP 404 if the trip
            does not exist.
    """
    trip_obj = get_trip(trip_id)
    if not trip_obj:
        return jsonify({"message": "Trip not found"}), 404

    return (
        jsonify({"trip": trip_obj.to_dict(include_items=True)}),
        200,
    )


# ── Driver-only routes (/me/trips) ─────────────────────────


@trip.route("/me/trips", methods=["GET"])
@login_required
def my_trips():
    """
    List all trips belonging to the current driver.

    Returns:
        Response: JSON ``{"trips": [<trip_dict>, ...]}``
            with HTTP 200.  Includes trips in every status
            (OPEN, CLOSED, COMPLETED, CANCELLED).
    """
    trips = get_driver_trips(current_user.user_id)
    return (
        jsonify({"trips": [t.to_dict() for t in trips]}),
        200,
    )


@trip.route("/me/trips", methods=["POST"])
@login_required
def create():
    """
    Create a new trip with items for the current driver.

    Expects a JSON body with the following fields:
        - store_name (str): Name of the warehouse store.
        - pickup_location_text (str): Human-readable pickup
            address.
        - pickup_time (str): ISO 8601 datetime string.
        - items (list[dict]): Each dict must contain name
            (str), unit (str), and total_quantity (int).
            Optional: pickup_lat, pickup_lng, price_per_unit.

    Returns:
        Response: JSON ``{"message": ..., "trip": <trip_dict>}``
            with HTTP 201 on success.  The trip dict includes
            nested items.  Returns HTTP 400 for validation
            errors, 403 if the user is not a driver, or 500
            on database failure.
    """
    data = request.get_json() or {}

    trip_obj, error, status = create_trip(current_user.user_id, data)

    if error:
        return jsonify({"message": error}), status

    return (
        jsonify(
            {
                "message": "Trip created successfully",
                "trip": trip_obj.to_dict(include_items=True),
            }
        ),
        201,
    )


@trip.route("/me/trips/<int:trip_id>", methods=["PUT"])
@login_required
def edit(trip_id):
    """
    Update an OPEN trip's details.

    Only the driver who owns the trip can edit it, and only
    while the trip status is OPEN.

    Args:
        trip_id (int): Primary key of the trip to update,
            extracted from the URL path.

    Expects a JSON body with any combination of:
        - store_name (str)
        - pickup_location_text (str)
        - pickup_time (str): ISO 8601 datetime.
        - pickup_lat (float)
        - pickup_lng (float)
        - items (list[dict]): Each dict must include
            item_id (int) and may include name, unit,
            total_quantity, or price_per_unit.

    Returns:
        Response: JSON ``{"message": ..., "trip": <trip_dict>}``
            with HTTP 200 on success.  Returns HTTP 400 for
            invalid pickup_time, 403 if not the trip owner,
            404 if trip not found, 409 if trip is not OPEN or
            quantity would drop below claimed, or 500 on
            database failure.
    """
    data = request.get_json() or {}

    trip_obj, error, status = update_trip(trip_id, current_user.user_id, data)

    if error:
        return jsonify({"message": error}), status

    return (
        jsonify(
            {
                "message": "Trip updated successfully",
                "trip": trip_obj.to_dict(include_items=True),
            }
        ),
        200,
    )


@trip.route("/me/trips/<int:trip_id>/close", methods=["PATCH"])
@login_required
def close(trip_id):
    """
    Close a trip (OPEN -> CLOSED).

    Prevents new claims from being placed.  Only the owning
    driver can close the trip.

    Args:
        trip_id (int): Primary key of the trip to close,
            extracted from the URL path.

    Returns:
        Response: JSON ``{"message": ..., "trip": <trip_dict>}``
            with HTTP 200 on success.  Returns HTTP 403 if
            not the trip owner, 404 if trip not found, 409
            if the trip is not currently OPEN, or 500 on
            database failure.
    """
    trip_obj, error, status = close_trip(trip_id, current_user.user_id)

    if error:
        return jsonify({"message": error}), status

    return (
        jsonify(
            {
                "message": "Trip closed successfully",
                "trip": trip_obj.to_dict(),
            }
        ),
        200,
    )


@trip.route("/me/trips/<int:trip_id>/complete", methods=["PATCH"])
@login_required
def complete(trip_id):
    """
    Complete a trip (CLOSED -> COMPLETED).

    Marks the trip as fully fulfilled.  Only the owning
    driver can complete the trip, and only after it has
    been closed.

    Args:
        trip_id (int): Primary key of the trip to complete,
            extracted from the URL path.

    Returns:
        Response: JSON ``{"message": ..., "trip": <trip_dict>}``
            with HTTP 200 on success.  Returns HTTP 403 if
            not the trip owner, 404 if trip not found, 409
            if the trip is not currently CLOSED, or 500 on
            database failure.
    """
    trip_obj, error, status = complete_trip(trip_id, current_user.user_id)

    if error:
        return jsonify({"message": error}), status

    return (
        jsonify(
            {
                "message": "Trip completed successfully",
                "trip": trip_obj.to_dict(),
            }
        ),
        200,
    )


@trip.route("/me/trips/<int:trip_id>/cancel", methods=["PATCH"])
@login_required
def cancel(trip_id):
    """
    Cancel a trip and cascade cancellation to all orders.

    Sets the trip status to CANCELLED and marks every
    associated order as CANCELLED.  Can be called on OPEN
    or CLOSED trips but not on COMPLETED ones.

    Args:
        trip_id (int): Primary key of the trip to cancel,
            extracted from the URL path.

    Returns:
        Response: JSON ``{"message": ..., "trip": <trip_dict>}``
            with HTTP 200 on success.  Returns HTTP 403 if
            not the trip owner, 404 if trip not found, 409
            if the trip is already COMPLETED, or 500 on
            database failure.
    """
    trip_obj, error, status = cancel_trip(trip_id, current_user.user_id)

    if error:
        return jsonify({"message": error}), status

    return (
        jsonify(
            {
                "message": "Trip cancelled successfully",
                "trip": trip_obj.to_dict(),
            }
        ),
        200,
    )
