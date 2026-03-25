from datetime import datetime, timezone
from flask_login import UserMixin

from ..extensions import db
from .enums import UserRole


class User(UserMixin, db.Model):
    """
    A registered Bulk Buddy user.

    Attributes:
        user_id: Primary key.
        email: Unique email used for login.
        password_hash: Hashed password -- never store plaintext.
        first_name: User's first name.
        last_name: User's last name.
        role: One of 'shopper', 'driver', or 'admin'. Defaults
            to 'shopper'; upgraded to 'driver' after an approved
            DriverApplication.
        address_street: Street portion of the user's address.
        address_city: City portion.
        address_state: State/province portion.
        address_zip: ZIP / postal code.
        latitude: Geocoded latitude from the address, stored at
            registration time so the nearby-trip query is a
            simple coordinate comparison rather than a geocoding
            call.
        longitude: Geocoded longitude, same rationale as
            latitude.
        created_at: Row creation timestamp (UTC).
        updated_at: Last-modified timestamp (UTC).
    """

    __tablename__ = "users"

    user_id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(255), unique=True, nullable=False, index=True)
    password_hash = db.Column(db.String(255), nullable=False)
    first_name = db.Column(db.String(100), nullable=False)
    last_name = db.Column(db.String(100), nullable=False)
    role = db.Column(
        db.Enum(UserRole, validate_strings=True),
        nullable=False,
        default=UserRole.SHOPPER,
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
        db.DateTime, nullable=False, default=lambda: datetime.now(timezone.utc)
    )
    updated_at = db.Column(
        db.DateTime,
        nullable=False,
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )

    # Relationships
    trips = db.relationship(
        "Trip",
        back_populates="driver",
        lazy="dynamic",
        cascade="all, delete-orphan",
    )
    orders = db.relationship(
        "Order",
        back_populates="shopper",
        lazy="dynamic",
        cascade="all, delete-orphan",
    )
    driver_applications = db.relationship(
        "DriverApplication",
        back_populates="user",
        lazy="dynamic",
        cascade="all, delete-orphan",
    )

    def get_id(self):
        """Override UserMixin to use user_id instead of id."""
        return str(self.user_id)

    @property
    def is_admin(self):
        """
        Check if the user has admin privileges.

        Returns:
            bool: True if user role is ADMIN, False otherwise.
        """
        return self.role == UserRole.ADMIN
    def full_name(self):
        """Return the user's display name."""
        return f"{self.first_name} {self.last_name}".strip()

    def to_public_dict(self):
        """
        Return the subset of user fields safe to expose in shared payloads.

        Returns:
            dict: Public user identity fields used by trip and order
                responses.
        """
        return {
            "user_id": self.user_id,
            "full_name": self.full_name,
            "role": self.role.value,
        }

    def to_dict(self):
        """
        Convert this User to a JSON-serializable dictionary.

        Returns:
            dict: User identity, role, address, and coordinate fields.
        """
        return {
            "user_id": self.user_id,
            "first_name": self.first_name,
            "last_name": self.last_name,
            "full_name": self.full_name,
            "email": self.email,
            "role": self.role.value,
            "address_street": self.address_street,
            "address_city": self.address_city,
            "address_state": self.address_state,
            "address_zip": self.address_zip,
            "latitude": self.latitude,
            "longitude": self.longitude,
        }

    def __repr__(self):
        return f"<User {self.user_id} {self.email} ({self.role})>"
