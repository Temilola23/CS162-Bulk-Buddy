"""Bulk Buddy database models.

All models are imported here so that:
1. The app factory can register them with a single `from . import models`.
2. Other modules can do `from app.models import User, Trip, ...`.
"""

from .user import User
from .trip import Trip
from .item import Item
from .order import Order
from .order_item import OrderItem
from .driver_application import DriverApplication

__all__ = [
    "User",
    "Trip",
    "Item",
    "Order",
    "OrderItem",
    "DriverApplication",
]
