from datetime import datetime, timezone

from ..extensions import db
from .enums import ApplicationStatus


class DriverApplication(db.Model):
    """
    A request from a shopper to become a verified driver.

    Kept as a separate table rather than columns on User
    because:
    1. A user might apply, get rejected, and reapply -- each
       attempt is its own row with its own timestamp/status.
    2. Keeps nullable driver-specific fields (license info,
       etc.) out of the users table.

    Attributes:
        driver_application_id: Primary key.
        user_id: FK to the user submitting the application.
        status: ApplicationStatus enum (PENDING, APPROVED,
            REJECTED). When approved, the user's role is
            upgraded to 'driver'.
        license_info: Driver's license number or other
            verification data.
        created_at: Row creation timestamp (UTC).
        updated_at: Last-modified timestamp (UTC).
    """

    __tablename__ = "driver_applications"

    driver_application_id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(
        db.Integer,
        db.ForeignKey("users.user_id"),
        nullable=False,
    )
    status = db.Column(
        db.Enum(ApplicationStatus, validate_strings=True),
        nullable=False,
        default=ApplicationStatus.PENDING,
    )
    license_info = db.Column(db.String(255), nullable=True)

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

    # Index: look up applications by user (check status, show history)
    __table_args__ = (db.Index("ix_driver_applications_user_id", "user_id"),)

    # Relationships
    user = db.relationship("User", back_populates="driver_applications")

    def to_dict(self):
        """
        Convert the application to a JSON-serializable dictionary.

        Args:
            None.

        Returns:
            dict: Dictionary with keys:
                - driver_application_id (int): Application ID.
                - user_id (int): User ID.
                - status (str): Application status
                  (PENDING, APPROVED, REJECTED).
                - license_info (str or None): License information if provided.
                - created_at (str): ISO format creation timestamp.
                - updated_at (str): ISO format last-modified timestamp.
        """
        return {
            "driver_application_id": self.driver_application_id,
            "user_id": self.user_id,
            "status": self.status.value,
            "license_info": self.license_info,
            "created_at": self.created_at.isoformat(),
            "updated_at": self.updated_at.isoformat(),
        }

    def __repr__(self):
        return (
            f"<DriverApplication {self.driver_application_id} "
            f"User {self.user_id} ({self.status})>"
        )
