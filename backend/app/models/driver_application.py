"""DriverApplication model for the shopper-to-driver upgrade flow.

Kept as a separate table rather than columns on User because:
1. A user might apply, get rejected, and reapply -- each attempt
   is its own row with its own timestamp and status.
2. Keeps nullable driver-specific fields (license info, etc.) out
   of the users table, which stays clean for all roles.
"""

from datetime import datetime, timezone

from ..extensions import db


class DriverApplication(db.Model):
    """A request from a shopper to become a verified driver.

    Attributes:
        id: Primary key.
        user_id: FK to the user submitting the application.
        status: One of 'pending', 'approved', or 'rejected'.
            When approved, the user's role is upgraded to 'driver'.
        license_info: Driver's license number or other verification
            data. Stored as a string for flexibility.
        created_at: Row creation timestamp (UTC).
        updated_at: Last-modified timestamp (UTC).
    """

    __tablename__ = "driver_applications"

    VALID_STATUSES = ("pending", "approved", "rejected")

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(
        db.Integer, db.ForeignKey("users.id"), nullable=False
    )
    status = db.Column(
        db.String(20), nullable=False, default="pending"
    )
    license_info = db.Column(db.String(255), nullable=True)

    created_at = db.Column(
        db.DateTime, nullable=False,
        default=lambda: datetime.now(timezone.utc)
    )
    updated_at = db.Column(
        db.DateTime, nullable=False,
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc)
    )

    # Index: look up applications by user (check status, show history)
    __table_args__ = (
        db.Index("ix_driver_applications_user_id", "user_id"),
    )

    # Relationships
    user = db.relationship("User", back_populates="driver_applications")

    def __repr__(self):
        return (
            f"<DriverApplication {self.id} "
            f"User {self.user_id} ({self.status})>"
        )
