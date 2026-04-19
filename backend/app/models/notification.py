from app.extensions import db
from app.models.enums import NotificationType


class Notification(db.Model):
    """In-app notification for a user."""

    __tablename__ = "notifications"

    notification_id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(
        db.Integer,
        db.ForeignKey("users.user_id"),
        nullable=False,
        index=True,
    )
    type = db.Column(db.Enum(NotificationType), nullable=False)
    message = db.Column(db.String(500), nullable=False)
    is_read = db.Column(db.Boolean, default=False, nullable=False)
    related_trip_id = db.Column(db.Integer, nullable=True)
    related_order_id = db.Column(db.Integer, nullable=True)
    created_at = db.Column(
        db.DateTime,
        server_default=db.func.now(),
        nullable=False,
    )

    user = db.relationship("User", backref="notifications")

    def to_dict(self):
        return {
            "notification_id": self.notification_id,
            "type": self.type.value,
            "message": self.message,
            "is_read": self.is_read,
            "related_trip_id": self.related_trip_id,
            "related_order_id": self.related_order_id,
            "created_at": self.created_at.isoformat(),
        }
