from ..extensions import db


class OrderItem(db.Model):
    """
    A single line item in a shopper's order.

    Join table between Orders and Items. Each row records how
    many units of a specific item a shopper claimed.
    """

    __tablename__ = "order_items"

    id = db.Column(db.Integer, primary_key=True)
    order_id = db.Column(
        db.Integer, db.ForeignKey("orders.id"), nullable=False
    )
    item_id = db.Column(db.Integer, db.ForeignKey("items.id"), nullable=False)
    quantity = db.Column(db.Integer, nullable=False)

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

    def __repr__(self):
        return (
            f"<OrderItem {self.id} "
            f"qty={self.quantity} of Item {self.item_id} "
            f"in Order {self.order_id}>"
        )
