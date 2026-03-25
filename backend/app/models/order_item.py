from datetime import datetime, timezone

from ..extensions import db


class OrderItem(db.Model):
    """
    A single line item in a shopper's order.

    Join table between Orders and Items. Each row records how
    many units of a specific item a shopper claimed.

    Attributes:
        order_item_id: Primary key.
        order_id: FK to the parent order.
        item_id: FK to the item being claimed.
        quantity: Number of units claimed. Must be > 0 and
            must not cause the item's claimed_quantity to
            exceed its total_quantity (enforced at the
            application layer inside a database transaction).
        created_at: Row creation timestamp (UTC).
    """

    __tablename__ = "order_items"

    order_item_id = db.Column(db.Integer, primary_key=True)
    order_id = db.Column(
        db.Integer,
        db.ForeignKey("orders.order_id"),
        nullable=False,
    )
    item_id = db.Column(
        db.Integer,
        db.ForeignKey("items.item_id"),
        nullable=False,
    )
    quantity = db.Column(db.Integer, nullable=False)

    created_at = db.Column(
        db.DateTime,
        nullable=False,
        default=lambda: datetime.now(timezone.utc),
    )

    # Indexes:
    # - order_id: fetch all line items for an order (checkout summary)
    # - item_id: check who has claimed a specific item
    __table_args__ = (
        db.Index("ix_order_items_order_id", "order_id"),
        db.Index("ix_order_items_item_id", "item_id"),
    )

    # Relationships
    order = db.relationship("Order", back_populates="order_items")
    item = db.relationship("Item", back_populates="order_items")

    def to_dict(self, include_item=False):
        """
        Convert this OrderItem to a JSON-serializable dictionary.

        Args:
            include_item (bool): When True, includes the nested item dict.

        Returns:
            dict: Order-item identity and quantity fields.
        """
        data = {
            "order_item_id": self.order_item_id,
            "order_id": self.order_id,
            "item_id": self.item_id,
            "quantity": self.quantity,
            "created_at": self.created_at.isoformat(),
        }
        if include_item and self.item:
            data["item"] = self.item.to_dict()
        return data

    def __repr__(self):
        return (
            f"<OrderItem {self.order_item_id} "
            f"qty={self.quantity} of Item {self.item_id} "
            f"in Order {self.order_id}>"
        )
