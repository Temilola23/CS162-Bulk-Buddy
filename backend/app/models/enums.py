import enum


class UserRole(enum.Enum):
    """Roles a user can have on the platform."""

    SHOPPER = "shopper"
    DRIVER = "driver"
    ADMIN = "admin"


class TripStatus(enum.Enum):
    """Lifecycle states for a trip."""

    OPEN = "open"
    CLOSED = "closed"
    COMPLETED = "completed"


class OrderStatus(enum.Enum):
    """Lifecycle states for an order."""

    CLAIMED = "claimed"
    PURCHASED = "purchased"
    READY_FOR_PICKUP = "ready_for_pickup"
    COMPLETED = "completed"
    CANCELLED = "cancelled"


class ApplicationStatus(enum.Enum):
    """Lifecycle states for a driver application."""

    PENDING = "pending"
    APPROVED = "approved"
    REJECTED = "rejected"
