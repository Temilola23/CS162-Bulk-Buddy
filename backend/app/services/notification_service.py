from sqlalchemy.exc import SQLAlchemyError
from app.extensions import db
from app.models import Notification


def create_notification(
    user_id,
    notification_type,
    message,
    related_trip_id=None,
    related_order_id=None,
):
    """Create an in-app notification for a user."""
    try:
        notification = Notification(
            user_id=user_id,
            type=notification_type,
            message=message,
            related_trip_id=related_trip_id,
            related_order_id=related_order_id,
        )
        db.session.add(notification)
        # Don't commit here - let the caller commit as part of
        # their transaction
        return notification
    except SQLAlchemyError:
        return None


def get_notifications(user_id):
    """Get all notifications for a user, newest first."""
    try:
        notifications = (
            Notification.query.filter_by(user_id=user_id)
            .order_by(Notification.created_at.desc())
            .limit(50)
            .all()
        )
        return [n.to_dict() for n in notifications], None, 200
    except SQLAlchemyError:
        return None, "Failed to fetch notifications", 500


def get_unread_count(user_id):
    """Get count of unread notifications."""
    try:
        count = Notification.query.filter_by(
            user_id=user_id, is_read=False
        ).count()
        return {"unread_count": count}, None, 200
    except SQLAlchemyError:
        return None, "Failed to fetch notification count", 500


def mark_as_read(notification_id, user_id):
    """Mark a single notification as read."""
    try:
        notification = db.session.get(Notification, notification_id)
        if not notification:
            return None, "Notification not found", 404
        if notification.user_id != user_id:
            return None, "Not your notification", 403
        notification.is_read = True
        db.session.commit()
        return notification.to_dict(), None, 200
    except SQLAlchemyError:
        db.session.rollback()
        return None, "Failed to mark notification as read", 500


def mark_all_as_read(user_id):
    """Mark all notifications as read for a user."""
    try:
        Notification.query.filter_by(user_id=user_id, is_read=False).update(
            {"is_read": True}
        )
        db.session.commit()
        return None, None, 200
    except SQLAlchemyError:
        db.session.rollback()
        return None, "Failed to mark notifications as read", 500
