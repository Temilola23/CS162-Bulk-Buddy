"""Order model linking a shopper's checkout to a specific trip.

One Order = one shopper checking out from one driver's trip.
If a shopper uses the inventory aggregation view and their cart
spans multiple drivers, the system creates one Order per trip
(the cart is split at the application layer).

Status transitions follow a strict sequence:
    pending -> purchased -> ready -> completed
    pending -> cancelled  (at any point before 'completed')
"""

from datetime import datetime, timezone

from ..extensions import db


class Order(db.Model):
    """A shopper's order against a single trip.

    Attributes:
        id: Primary key.
        shopper_id: FK to the user who placed this order.
        trip_id: FK to the trip this order is placed against.
        status: Current state of the order. Follows the transition
            sequence defined in the module docstring.
        created_at: Row creation timestamp (UTC).
        updated_at: Last-modified timestamp (UTC).
    """

    __tablename__ = "orders"

    VALID_STATUSES = (
        "pending", "purchased", "ready", "completed", "cancelled"
    )

    id = db.Column(db.Integer, primary_key=True)
    shopper_id = db.Column(
        db.Integer, db.ForeignKey("users.id"), nullable=False
    )
    trip_id = db.Column(
        db.Integer, db.ForeignKey("trips.id"), nullable=False
    )
    status = db.Column(
        db.String(20), nullable=False, default="pending"
    )

    created_at = db.Column(
        db.DateTime, nullable=False,
        default=lambda: datetime.now(timezone.utc)
    )
    updated_at = db.Column(
        db.DateTime, nullable=False,
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc)
    )

    # Indexes:
    # - shopper_id: "my orders" page for the shopper
    # - trip_id: driver viewing all orders against their trip
    __table_args__ = (
        db.Index("ix_orders_shopper_id", "shopper_id"),
        db.Index("ix_orders_trip_id", "trip_id"),
    )

    # Relationships
    shopper = db.relationship("User", back_populates="orders")
    trip = db.relationship("Trip", back_populates="orders")
    order_items = db.relationship(
        "OrderItem", back_populates="order", lazy="dynamic",
        cascade="all, delete-orphan"
    )

    def __repr__(self):
        return (
            f"<Order {self.id} by User {self.shopper_id} "
            f"on Trip {self.trip_id} ({self.status})>"
        )
