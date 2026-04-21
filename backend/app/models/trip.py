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
        status: One of TripStatus.OPEN, CLOSED, PURCHASED,
            READY_FOR_PICKUP, COMPLETED, or CANCELLED.
            - OPEN: accepting claims from shoppers.
            - CLOSED: no longer accepting claims.
            - PURCHASED: driver has bought the claimed items.
            - READY_FOR_PICKUP: claimed items are ready for handoff.
            - COMPLETED: all handoffs done.
            - CANCELLED: trip cancelled by the driver.
        created_at: Row creation timestamp (UTC).
        updated_at: Last-modified timestamp (UTC).
    """

    __tablename__ = "trips"

    trip_id = db.Column(db.Integer, primary_key=True)
    driver_id = db.Column(
        db.Integer,
        db.ForeignKey("users.user_id", ondelete="CASCADE"),
        nullable=False,
    )
    store_name = db.Column(db.String(150), nullable=False)
    pickup_location_text = db.Column(db.String(255), nullable=False)

    # Separate from the driver's home coordinates so the driver can
    # choose a custom pickup spot per trip
    pickup_lat = db.Column(db.Float, nullable=True)
    pickup_lng = db.Column(db.Float, nullable=True)

    pickup_time = db.Column(db.DateTime, nullable=False)
    status = db.Column(
        db.Enum(TripStatus, validate_strings=True),
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

    def to_dict(self, include_items=False, include_driver=False):
        """
        Convert this Trip to a JSON-serializable dictionary.

        Args:
            include_items (bool): When True, includes a nested
                list of item dicts under the ``items`` key.
                Defaults to False.
            include_driver (bool): When True, includes a nested
                driver dict under the ``driver`` key.

        Returns:
            dict: Trip fields including trip_id, driver_id,
                store_name, pickup_location_text, pickup_lat,
                pickup_lng, pickup_time, status, created_at,
                and updated_at.  Optionally includes items.
        """
        data = {
            "trip_id": self.trip_id,
            "driver_id": self.driver_id,
            "store_name": self.store_name,
            "pickup_location_text": self.pickup_location_text,
            "pickup_lat": self.pickup_lat,
            "pickup_lng": self.pickup_lng,
            "pickup_time": self.pickup_time.isoformat(),
            "status": self.status.value,
            "created_at": self.created_at.isoformat(),
            "updated_at": self.updated_at.isoformat(),
        }
        if include_items:
            data["items"] = [i.to_dict() for i in self.items]
        if include_driver and self.driver:
            data["driver"] = self.driver.to_public_dict()
        return data

    def __repr__(self):
        return (
            f"<Trip {self.trip_id} {self.store_name} "
            f"({self.status}) by User {self.driver_id}>"
        )
