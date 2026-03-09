from datetime import datetime, timezone

from ..extensions import db


class DriverApplication(db.Model):
    """
    A request from a shopper to become a verified driver.

    Separate table from User so users can reapply after
    rejection, and driver-specific fields stay out of the
    users table.
    """

    __tablename__ = "driver_applications"

    VALID_STATUSES = ("pending", "approved", "rejected")

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    status = db.Column(db.String(20), nullable=False, default="pending")
    license_info = db.Column(db.String(255), nullable=True)

    created_at = db.Column(
        db.DateTime, nullable=False, default=lambda: datetime.now(timezone.utc)
    )
    updated_at = db.Column(
        db.DateTime,
        nullable=False,
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )

    # Index: look up applications by user (check status, show history)
    __table_args__ = (db.Index("ix_driver_applications_user_id", "user_id"),)

    # Relationships
    user = db.relationship("User", back_populates="driver_applications")

    def __repr__(self):
        return (
            f"<DriverApplication {self.id} "
            f"User {self.user_id} ({self.status})>"
        )
