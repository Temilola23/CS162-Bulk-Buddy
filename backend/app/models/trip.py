from datetime import datetime, timezone

from ..extensions import db
from .enums import TripStatus


class Trip(db.Model):
    """
    A driver's upcoming trip to a warehouse store.

    Has its own pickup coordinates rather than inheriting the
    driver's address, because the driver may choose a different
    pickup spot per trip.

    Attributes:
        trip_id: Primary key.
        driver_id: FK to the user who created this trip.
        store_name: Name of the warehouse store.
        pickup_location_text: Human-readable pickup address.
        pickup_lat: Latitude of the pickup point.
        pickup_lng: Longitude of the pickup point.
        pickup_time: When the driver will be available for
            handoff.
        status: One of TripStatus.OPEN, CLOSED, or COMPLETED.
            - OPEN: accepting claims from shoppers.
            - CLOSED: no longer accepting claims.
            - COMPLETED: all handoffs done.
        created_at: Row creation timestamp (UTC).
        updated_at: Last-modified timestamp (UTC).
    """

    __tablename__ = "trips"

    trip_id = db.Column(db.Integer, primary_key=True)
    driver_id = db.Column(
        db.Integer, db.ForeignKey("users.user_id"), nullable=False
    )
    store_name = db.Column(db.String(150), nullable=False)
    pickup_location_text = db.Column(db.String(255), nullable=False)

    # Separate from the driver's home coordinates so the driver can
    # choose a custom pickup spot per trip
    pickup_lat = db.Column(db.Float, nullable=True)
    pickup_lng = db.Column(db.Float, nullable=True)

    pickup_time = db.Column(db.DateTime, nullable=False)
    status = db.Column(
        db.Enum(TripStatus),
        nullable=False,
        default=TripStatus.OPEN,
    )

    created_at = db.Column(
        db.DateTime,
        nullable=False,
        default=lambda: datetime.now(timezone.utc),
    )
    updated_at = db.Column(
        db.DateTime,
        nullable=False,
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )

    # Indexes for hot queries:
    # - driver_id: "my trips" page for the driver
    # - status: filtering open trips on the trip feed
    # - (status + pickup coords): nearby open trips sorted by distance
    __table_args__ = (
        db.Index("ix_trips_driver_id", "driver_id"),
        db.Index("ix_trips_status", "status"),
        db.Index(
            "ix_trips_status_coords",
            "status",
            "pickup_lat",
            "pickup_lng",
        ),
    )

    # Relationships
    driver = db.relationship("User", back_populates="trips")
    items = db.relationship(
        "Item",
        back_populates="trip",
        lazy="dynamic",
        cascade="all, delete-orphan",
    )
    orders = db.relationship(
        "Order",
        back_populates="trip",
        lazy="dynamic",
        cascade="all, delete-orphan",
    )

    def __repr__(self):
        return (
            f"<Trip {self.trip_id} {self.store_name} "
            f"({self.status}) by User {self.driver_id}>"
        )
