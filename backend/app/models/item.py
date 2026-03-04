"""Item model for products listed on a trip.

Each Item belongs to exactly one Trip. The `claimed_quantity` column
is an intentional denormalization: its true value could be derived
from SUM(order_items.quantity), but storing it directly avoids a
join + aggregate on every trip card render and availability check.
It is updated atomically inside the same transaction that creates
an OrderItem, so it stays consistent.
"""

from datetime import datetime, timezone

from ..extensions import db


class Item(db.Model):
    """A bulk product a driver plans to buy on a trip.

    Attributes:
        id: Primary key.
        trip_id: FK to the trip this item belongs to.
        name: Product name (e.g. 'Paper Towels 12-pack').
        unit: Unit of measurement (e.g. 'pack', 'lb', 'case').
        total_quantity: How many units the driver can accommodate.
        claimed_quantity: How many units have been claimed so far.
            Invariant: claimed_quantity <= total_quantity.
            Enforced at the application layer inside a transaction.
        price_per_unit: Cost per unit, used for payment splitting.
        created_at: Row creation timestamp (UTC).
    """

    __tablename__ = "items"

    id = db.Column(db.Integer, primary_key=True)
    trip_id = db.Column(
        db.Integer, db.ForeignKey("trips.id"), nullable=False
    )
    name = db.Column(db.String(200), nullable=False)
    unit = db.Column(db.String(50), nullable=False)
    total_quantity = db.Column(db.Integer, nullable=False)
    claimed_quantity = db.Column(
        db.Integer, nullable=False, default=0
    )
    price_per_unit = db.Column(
        db.Float, nullable=True
    )

    created_at = db.Column(
        db.DateTime, nullable=False,
        default=lambda: datetime.now(timezone.utc)
    )

    # Index on trip_id -- the most common query is "items for this trip"
    __table_args__ = (
        db.Index("ix_items_trip_id", "trip_id"),
    )

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
