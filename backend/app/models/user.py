from datetime import datetime, timezone
from flask_login import UserMixin

from ..extensions import db


class User(UserMixin, db.Model):
    """
    A registered Bulk Buddy user.

    Roles: shopper (default), driver (after approved application),
    admin. Address + coordinates support distance-sorted trip feed.
    """

    __tablename__ = "users"

    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(255), unique=True, nullable=False, index=True)
    password_hash = db.Column(db.String(255), nullable=False)
    first_name = db.Column(db.String(100), nullable=False)
    last_name = db.Column(db.String(100), nullable=False)
    role = db.Column(db.String(20), nullable=False, default="shopper")

    # Address fields -- required at registration per FR-1
    address_street = db.Column(db.String(255), nullable=False)
    address_city = db.Column(db.String(100), nullable=False)
    address_state = db.Column(db.String(50), nullable=False)
    address_zip = db.Column(db.String(20), nullable=False)

    # Pre-computed coordinates for distance queries
    latitude = db.Column(db.Float, nullable=True)
    longitude = db.Column(db.Float, nullable=True)

    created_at = db.Column(
        db.DateTime, nullable=False, default=lambda: datetime.now(timezone.utc)
    )
    updated_at = db.Column(
        db.DateTime,
        nullable=False,
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )

    # Relationships
    trips = db.relationship("Trip", back_populates="driver", lazy="dynamic")
    orders = db.relationship("Order", back_populates="shopper", lazy="dynamic")
    driver_applications = db.relationship(
        "DriverApplication", back_populates="user", lazy="dynamic"
    )

    def __repr__(self):
        return f"<User {self.id} {self.email} ({self.role})>"
