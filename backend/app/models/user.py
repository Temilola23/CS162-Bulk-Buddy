"""User model for authentication, roles, and location data.

Every person on the platform is a User. The `role` field determines
what actions they can perform (shopper, driver, or admin). The address
and lat/lng fields support the distance-sorted trip feed -- storing
coordinates at registration time avoids repeated geocoding API calls.
"""

from datetime import datetime, timezone

from ..extensions import db


class User(db.Model):
    """A registered Bulk Buddy user.

    Attributes:
        id: Primary key.
        email: Unique email used for login.
        password_hash: Bcrypt (or similar) hash -- never store plaintext.
        first_name: User's first name.
        last_name: User's last name.
        role: One of 'shopper', 'driver', or 'admin'. Defaults to
            'shopper'; upgraded to 'driver' after an approved
            DriverApplication.
        address_street: Street portion of the user's address.
        address_city: City portion.
        address_state: State/province portion.
        address_zip: ZIP / postal code.
        latitude: Geocoded latitude from the address, stored at
            registration time so the nearby-trip query is a simple
            coordinate comparison rather than a geocoding call.
        longitude: Geocoded longitude, same rationale as latitude.
        created_at: Row creation timestamp (UTC).
        updated_at: Last-modified timestamp (UTC).
    """

    __tablename__ = "users"

    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(
        db.String(255), unique=True, nullable=False, index=True
    )
    password_hash = db.Column(db.String(255), nullable=False)
    first_name = db.Column(db.String(100), nullable=False)
    last_name = db.Column(db.String(100), nullable=False)
    role = db.Column(
        db.String(20), nullable=False, default="shopper"
    )

    # Address fields -- required at registration per FR-1
    address_street = db.Column(db.String(255), nullable=False)
    address_city = db.Column(db.String(100), nullable=False)
    address_state = db.Column(db.String(50), nullable=False)
    address_zip = db.Column(db.String(20), nullable=False)

    # Pre-computed coordinates for distance queries
    latitude = db.Column(db.Float, nullable=True)
    longitude = db.Column(db.Float, nullable=True)

    created_at = db.Column(
        db.DateTime, nullable=False,
        default=lambda: datetime.now(timezone.utc)
    )
    updated_at = db.Column(
        db.DateTime, nullable=False,
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc)
    )

    # Relationships
    trips = db.relationship(
        "Trip", back_populates="driver", lazy="dynamic"
    )
    orders = db.relationship(
        "Order", back_populates="shopper", lazy="dynamic"
    )
    driver_applications = db.relationship(
        "DriverApplication", back_populates="user", lazy="dynamic"
    )

    def __repr__(self):
        return f"<User {self.id} {self.email} ({self.role})>"
