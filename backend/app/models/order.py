from datetime import datetime, timezone

from ..extensions import db


class Order(db.Model):
    """
    A shopper's order against a single trip.

    Status transitions: claimed -> purchased -> ready_for_pickup
    -> completed (or cancelled at any point before completed).
    """

    __tablename__ = "orders"

    VALID_STATUSES = (
        "claimed",
        "purchased",
        "ready_for_pickup",
        "completed",
        "cancelled",
    )

    id = db.Column(db.Integer, primary_key=True)
    shopper_id = db.Column(
        db.Integer, db.ForeignKey("users.id"), nullable=False
    )
    trip_id = db.Column(db.Integer, db.ForeignKey("trips.id"), nullable=False)
    status = db.Column(db.String(20), nullable=False, default="claimed")

    created_at = db.Column(
        db.DateTime, nullable=False, default=lambda: datetime.now(timezone.utc)
    )
    updated_at = db.Column(
        db.DateTime,
        nullable=False,
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
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
        "OrderItem",
        back_populates="order",
        lazy="dynamic",
        cascade="all, delete-orphan",
    )

    def __repr__(self):
        return (
            f"<Order {self.id} by User {self.shopper_id} "
            f"on Trip {self.trip_id} ({self.status})>"
        )
