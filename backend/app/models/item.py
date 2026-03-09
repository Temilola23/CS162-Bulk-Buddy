from datetime import datetime, timezone

from ..extensions import db


class Item(db.Model):
    """
    A bulk product a driver plans to buy on a trip.

    claimed_quantity is an intentional denormalization (avoids
    join+aggregate on every trip card). Updated atomically with
    OrderItem creation.
    """

    __tablename__ = "items"

    id = db.Column(db.Integer, primary_key=True)
    trip_id = db.Column(db.Integer, db.ForeignKey("trips.id"), nullable=False)
    name = db.Column(db.String(200), nullable=False)
    unit = db.Column(db.String(50), nullable=False)
    total_quantity = db.Column(db.Integer, nullable=False)
    claimed_quantity = db.Column(db.Integer, nullable=False, default=0)
    price_per_unit = db.Column(db.Float, nullable=True)

    created_at = db.Column(
        db.DateTime, nullable=False, default=lambda: datetime.now(timezone.utc)
    )

    # Index on trip_id -- the most common query is "items for this trip"
    __table_args__ = (db.Index("ix_items_trip_id", "trip_id"),)

    # Relationships
    trip = db.relationship("Trip", back_populates="items")
    order_items = db.relationship(
        "OrderItem", back_populates="item", lazy="dynamic"
    )

    @property
    def available_quantity(self):
        """Units still available for shoppers to claim."""
        return self.total_quantity - self.claimed_quantity

    def __repr__(self):
        return (
            f"<Item {self.id} '{self.name}' "
            f"{self.claimed_quantity}/{self.total_quantity} "
            f"on Trip {self.trip_id}>"
        )
