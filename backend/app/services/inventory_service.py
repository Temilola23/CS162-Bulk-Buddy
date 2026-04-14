from app.extensions import db
from app.models import Item, Trip
from app.models.enums import TripStatus


def get_available_inventory():
    """
    Return items from open trips that still have availability.

    Queries items joined to their trip, filtering for OPEN trips
    and items where total_quantity > claimed_quantity. Results are
    ordered by trip pickup_time ascending so the soonest trips
    appear first.

    Returns:
        list[dict]: Each dict is an item with a nested trip
            (including driver info).
    """
    items = (
        db.session.query(Item)
        .join(Trip, Item.trip_id == Trip.trip_id)
        .filter(
            Trip.status == TripStatus.OPEN,
            Item.total_quantity > Item.claimed_quantity,
        )
        .order_by(Trip.pickup_time.asc())
        .all()
    )

    return [
        {**item.to_dict(), "trip": item.trip.to_dict(include_driver=True)}
        for item in items
    ]
