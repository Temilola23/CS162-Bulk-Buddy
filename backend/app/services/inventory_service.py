from sqlalchemy.orm import joinedload

from app.extensions import db
from app.models import Item, Trip
from app.models.enums import TripStatus


def get_available_inventory(exclude_driver_id=None):
    """
    Return items from open trips that still have availability.

    Queries items joined to their trip, filtering for OPEN trips
    and items where total_quantity > claimed_quantity. Results are
    ordered by trip pickup_time ascending so the soonest trips
    appear first. Trip and driver are eager-loaded to avoid N+1
    queries during serialization.

    Args:
        exclude_driver_id: Optional user ID to omit from the results
            so drivers do not see their own inventory in the
            shopper-facing feed.

    Returns:
        list[dict]: Each dict is an item with a nested trip
            (including driver info).
    """
    query = (
        db.session.query(Item)
        .options(joinedload(Item.trip).joinedload(Trip.driver))
        .join(Trip, Item.trip_id == Trip.trip_id)
        .filter(
            Trip.status == TripStatus.OPEN,
            Item.total_quantity > Item.claimed_quantity,
        )
    )

    if exclude_driver_id is not None:
        query = query.filter(Trip.driver_id != exclude_driver_id)

    items = query.order_by(Trip.pickup_time.asc()).all()

    return [
        {**item.to_dict(), "trip": item.trip.to_dict(include_driver=True)}
        for item in items
    ]
