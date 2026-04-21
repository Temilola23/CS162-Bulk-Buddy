from datetime import datetime, timezone

from ..extensions import db
from .enums import OrderStatus


class Order(db.Model):
    """
    A shopper's order against a single trip.

    One Order = one shopper checking out from one driver's trip.
    If a shopper's cart spans multiple drivers, the system
    creates one Order per trip.

    Status transitions:
        CLAIMED -> PURCHASED -> READY_FOR_PICKUP -> COMPLETED
        any non-completed state -> CANCELLED

    PURCHASED, READY_FOR_PICKUP, and CANCELLED are driven by the parent
    trip status. Shoppers can only complete their own orders once the trip
    has made them ready for pickup.

    Attributes:
        order_id: Primary key.
        shopper_id: FK to the user who placed this order.
        trip_id: FK to the trip this order is placed against.
        status: Current state of the order (OrderStatus enum).
        created_at: Row creation timestamp (UTC).
        updated_at: Last-modified timestamp (UTC).
    """

    __tablename__ = "orders"

    order_id = db.Column(db.Integer, primary_key=True)
    shopper_id = db.Column(
        db.Integer,
        db.ForeignKey("users.user_id", ondelete="CASCADE"),
        nullable=False,
    )
    trip_id = db.Column(
        db.Integer,
        db.ForeignKey("trips.trip_id", ondelete="CASCADE"),
        nullable=False,
    )
    status = db.Column(
        db.Enum(OrderStatus, validate_strings=True),
        nullable=False,
        default=OrderStatus.CLAIMED,
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

    def to_dict(self, include_trip=False, include_order_items=False):
        """
        Convert this Order to a JSON-serializable dictionary.

        Args:
            include_trip (bool): When True, includes nested trip data with
            driver.
            include_order_items (bool): When True, includes nested claimed
            items.

        Returns:
            dict: Order identity, status, and timestamp fields.
        """
        data = {
            "order_id": self.order_id,
            "shopper_id": self.shopper_id,
            "trip_id": self.trip_id,
            "status": self.status.value,
            "created_at": self.created_at.isoformat(),
            "updated_at": self.updated_at.isoformat(),
        }
        if include_trip and self.trip:
            data["trip"] = self.trip.to_dict(
                include_items=True,
                include_driver=True,
            )
        if include_order_items:
            data["order_items"] = [
                order_item.to_dict(include_item=True)
                for order_item in self.order_items
            ]
        return data

    def __repr__(self):
        return (
            f"<Order {self.order_id} by User {self.shopper_id} "
            f"on Trip {self.trip_id} ({self.status})>"
        )
