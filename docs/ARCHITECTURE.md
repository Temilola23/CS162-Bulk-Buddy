# Architecture Overview

Bulk Buddy connects San Francisco residents (shoppers) with
drivers heading to warehouse stores (Costco, Sam's Club, etc.)
so they can piggyback on bulk purchases without a membership
or car.

## System Architecture

```
┌────────────────────────────────────────────────────────────────┐
│                        CLIENT (Browser)                        │
│                                                                │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │                   React Frontend                         │  │
│  │                                                          │  │
│  │  Pages:                                                  │  │
│  │  ┌───────────┐ ┌──────────┐ ┌──────────┐ ┌────────────┐  │  │
│  │  │ Landing   │ │ Sign Up  │ │  Log In  │ │ Trip Feed  │  │  │
│  │  └───────────┘ └──────────┘ └──────────┘ └────────────┘  │  │
│  │  ┌───────────┐ ┌──────────┐ ┌──────────┐ ┌────────────┐  │  │
│  │  │Trip Detail│ │Post Trip │ │My Orders │ │ My Trips   │  │  │
│  │  └───────────┘ └──────────┘ └──────────┘ └────────────┘  │  │
│  │  ┌──────────┐ ┌──────────┐                               │  │
│  │  │ Profile  │ │Driver App│                               │  │
│  │  └──────────┘ └──────────┘                               │  │
│  └──────────────────────┬───────────────────────────────────┘  │
│                         │ HTTP (JSON + Session Cookie)         │
└─────────────────────────┼──────────────────────────────────────┘
                          │
                          ▼
┌────────────────────────────────────────────────────────────────┐
│                     FLASK BACKEND                              │
│                                                                │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │                    Routes (Blueprints)                   │  │
│  │                                                          │  │
│  │  /api/signup    POST   Register new user                 │  │
│  │  /api/login     POST   Authenticate + create session     │  │
│  │  /api/logout    POST   End session                       │  │
│  │                                                          │  │
│  │  /api/trips          GET   Browse open trips (feed)      │  │
│  │  /api/trips/:id      GET   Get trip with items           │  │
│  │  /api/me/trips       GET   Driver's trips (all statuses) │  │
│  │  /api/me/trips       POST  Create trip with items        │  │
│  │  /api/me/trips/:id   PUT   Edit an OPEN trip             │  │
│  │  /api/me/trips/:id/close    PATCH  Close trip            │  │
│  │  /api/me/trips/:id/complete PATCH  Complete trip         │  │
│  │  /api/me/trips/:id/cancel   PATCH  Cancel + cascade      │  │
│  │  /api/driver/apply   POST  Apply to become driver        │  │
│  │                                                          │  │
│  │  /health             GET   Health check                  │  │
│  └───────────────────────┬──────────────────────────────────┘  │
│                          │                                     │
│  ┌───────────────────────▼──────────────────────────────────┐  │
│  │                   Services Layer                         │  │
│  │                                                          │  │
│  │  auth_service     authenticate, register, logout         │  │
│  │  trip_service     create, list, edit, close,             │  │
│  │                   complete, cancel                       │  │
│  │  driver_service   apply to become driver                 │  │
│  │  order_service    claim items, update status    (planned)│  │
│  │                                                          │  │
│  │  Responsibilities:                                       │  │
│  │  - Input validation (clear error messages)               │  │
│  │  - Business rules (status transitions, oversell check)   │  │
│  │  - Database transactions (atomic claim + quantity update)│  │
│  └───────────────────────┬──────────────────────────────────┘  │
│                          │                                     │
│  ┌───────────────────────▼──────────────────────────────────┐  │
│  │                   Models (SQLAlchemy ORM)                │  │
│  │                                                          │  │
│  │  User ──1:N──▶ Trip ──1:N──▶ Item                        │  │
│  │  User ──1:N──▶ Order ──1:N──▶ OrderItem ◀──N:1── Item    │  │
│  │  User ──1:N──▶ DriverApplication                         │  │
│  │  Order ──N:1──▶ Trip                                     │  │
│  │                                                          │  │
│  │  Enums: UserRole, TripStatus, OrderStatus,               │  │
│  │         ApplicationStatus                                │  │
│  └───────────────────────┬──────────────────────────────────┘  │
│                          │ SQLAlchemy ORM                      │
└──────────────────────────┼─────────────────────────────────────┘
                           │
                           ▼
              ┌────────────────────────┐
              │    SQLite Database     │
              │                        │
              │  Tables:               │
              │  - users               │
              │  - trips               │
              │  - items               │
              │  - orders              │
              │  - order_items         │
              │  - driver_applications │
              └────────────────────────┘
```

## Request Flow

A typical request flows through four layers:

```
Browser ──▶ Route ──▶ Service ──▶ Model ──▶ Database
                                              │
Browser ◀── Route ◀── Service ◀── Model ◀─────┘
```

**Example: Shopper claims items from a trip**

```
1. Frontend sends POST /api/trips/5/claims
   Body: { "items": [{ "item_id": 12, "quantity": 3 }] }

2. Route (claims blueprint):
   - Extracts JSON body
   - Calls order_service.create_claim(shopper, trip_id, items)

3. Service (order_service):
   - Validates trip exists and is OPEN
   - Validates shopper is not the driver
   - Checks each item has enough available_quantity
   - In a single transaction:
     a. Creates Order (status=CLAIMED)
     b. Creates OrderItem rows
     c. Increments item.claimed_quantity
   - Returns (order, None, 201) or (None, error, status)

4. Route returns JSON response:
   { "order_id": 42, "status": "claimed", "items": [...] }
```

## Entity Relationship Diagram

```
┌──────────────────────┐
│        users         │
├──────────────────────┤
│ user_id (PK)         │
│ email (UNIQUE)       │
│ password_hash        │
│ first_name           │
│ last_name            │
│ role (enum)          │──────────────────────────────┐
│ address_street       │                              │
│ address_city         │                              │
│ address_state        │                              │
│ address_zip          │                              │
│ latitude             │                              │
│ longitude            │                              │
│ created_at           │                              │
│ updated_at           │                              │
└──────┬───────┬───────┘                              │
       │       │                                      │
       │       │ 1:N (as driver)                      │ 1:N
       │       │                                      │
       │  ┌────▼───────────────────┐          ┌───────▼──────────────┐
       │  │        trips           │          │ driver_applications  │
       │  ├────────────────────────┤          ├──────────────────────┤
       │  │ trip_id (PK)           │          │ driver_application_id│
       │  │ driver_id (FK→users)   │          │ user_id (FK→users)   │
       │  │ store_name             │          │ status (enum)        │
       │  │ pickup_location_text   │          │ license_info         │
       │  │ pickup_lat             │          │ created_at           │
       │  │ pickup_lng             │          │ updated_at           │
       │  │ pickup_time            │          └──────────────────────┘
       │  │ status (enum)          │
       │  │ created_at             │
       │  │ updated_at             │
       │  └──────┬─────────┬───────┘
       │         │         │
       │         │ 1:N     │ 1:N
       │         │         │
       │    ┌────▼──────┐  │
       │    │  items    │  │
       │    ├───────────┤  │
       │    │ item_id   │  │
       │    │ trip_id   │  │
       │    │ name      │  │
       │    │ unit      │  │
       │    │ total_qty │  │
       │    │ claimed   │  │
       │    │ price     │  │
       │    │ created_at│  │
       │    │ updated_at│  │
       │    └─────┬─────┘  │
       │          │        │
       │          │ 1:N    │
       │          │        │
       │  ┌───────▼────────▼──────┐
       │  │     order_items       │
       │  ├───────────────────────┤
       │  │ order_item_id (PK)    │
       │  │ order_id (FK→orders)  │
       │  │ item_id (FK→items)    │
       │  │ quantity              │
       │  │ created_at            │
       │  └───────────▲───────────┘
       │              │
       │              │ 1:N
       │              │
       │  ┌───────────┴───────────┐
       │  │       orders          │
       │  ├───────────────────────┤
       │  │ order_id (PK)         │
       └──▶ shopper_id (FK→users) │
          │ trip_id (FK→trips)    │
          │ status (enum)         │
          │ created_at            │
          │ updated_at            │
          └───────────────────────┘
```

## Separation of Concerns

### Frontend (React) — Presentation Layer

- Renders UI and handles user interactions
- Manages client-side routing between pages
- Sends JSON requests to backend API
- Receives JSON responses and session cookies
- No direct database access, no business logic

### Routes (Flask Blueprints) — API Layer

- Defines HTTP endpoints (method + path)
- Extracts request data (JSON body, query params)
- Delegates to the appropriate service function
- Returns JSON responses with status codes
- Handles auth decorators (`@login_required`)

### Services — Business Logic Layer

- Contains all business rules and validation
- Returns tuples: `(result, error_message, status_code)`
- Manages database transactions (commit/rollback)
- Enforces status transitions and constraints
- Keeps routes thin and models clean

### Models (SQLAlchemy) — Data Layer

- Defines database schema via Python classes
- Declares relationships, indexes, and constraints
- Provides properties for computed values
(e.g., `item.available_quantity`)
- Validates data at the DB level (enums, nullable,
foreign keys) as a safety net

### Database (SQLite) — Persistence Layer

- Stores all application data
- Accessed only through SQLAlchemy ORM
- Foreign key enforcement enabled via PRAGMA
- In-memory SQLite used for testing

## Status Lifecycles

### Trip Status

```
OPEN ──▶ CLOSED ──▶ COMPLETED
  │         │
  │         └──▶ CANCELLED (cascades orders to CANCELLED)
  └──▶ CANCELLED (cascades orders to CANCELLED)

  OPEN:      accepting claims from shoppers
  CLOSED:    no new claims; driver heading to store
  COMPLETED: all pickups done
  CANCELLED: driver cancelled; all orders also cancelled
```

### Order Status

```
CLAIMED ──▶ PURCHASED ──▶ READY_FOR_PICKUP ──▶ COMPLETED
   │
   └──▶ CANCELLED (at any point before COMPLETED)
```

### Driver Application Status

```
PENDING ──▶ APPROVED (user role → DRIVER)
   │
   └──▶ REJECTED (user can reapply)
```

## API Endpoints

### Implemented


| Method | Path                         | Auth   | Description                   |
| ------ | ---------------------------- | ------ | ----------------------------- |
| POST   | `/api/signup`                | No     | Register new user             |
| POST   | `/api/login`                 | No     | Log in, create session        |
| POST   | `/api/logout`                | Yes    | End session                   |
| GET    | `/health`                    | No     | Health check                  |
| GET    | `/api/inventory`             | Yes    | Browse available item feed    |
| GET    | `/api/trips`                 | Yes    | Browse open trips (feed)      |
| GET    | `/api/trips/:id`             | Yes    | Get trip with items           |
| GET    | `/api/me/trips`              | Driver | Driver's trips (all statuses) |
| POST   | `/api/me/trips`              | Driver | Create trip with items        |
| PUT    | `/api/me/trips/:id`          | Driver | Edit an OPEN trip             |
| PATCH  | `/api/me/trips/:id/close`    | Driver | Close trip (OPEN->CLOSED)     |
| PATCH  | `/api/me/trips/:id/complete` | Driver | Complete trip (CLOSED->DONE)  |
| PATCH  | `/api/me/trips/:id/cancel`   | Driver | Cancel trip + cascade orders  |
| POST   | `/api/driver/apply`          | Yes    | Apply to become driver        |


### Planned


| Method | Path                                 | Auth    | Description         |
| ------ | ------------------------------------ | ------- | ------------------- |
| POST   | `/api/trips/:id/claims`              | Shopper | Claim items         |
| PATCH  | `/api/claims/:id/status`             | Driver  | Update order status |
| GET    | `/api/me/orders`                     | Shopper | Shopper's orders    |
| PATCH  | `/api/admin/driver-applications/:id` | Admin   | Review application  |


## `/api/inventory` API Contract

The `GET /api/inventory` endpoint powers an item-centric shopper feed.

### Behavior

- Requires authentication (`@login_required`)
- Returns items only from trips with status `OPEN`
- Returns only items where `total_quantity > claimed_quantity`
- Excludes items from trips owned by the current user
(consistent with `GET /api/trips` excluding driver-owned trips)
- Sorted by `trip.pickup_time` ascending (soonest pickup first)

### Response shape

```json
{
  "items": [
    {
      "item_id": 12,
      "trip_id": 5,
      "name": "Paper Towels",
      "unit": "pack",
      "total_quantity": 10,
      "claimed_quantity": 3,
      "available_quantity": 7,
      "price_per_unit": 15.99,
      "trip": {
        "trip_id": 5,
        "store_name": "Costco",
        "pickup_location_text": "123 Main St",
        "pickup_time": "2026-04-20T18:00:00+00:00",
        "status": "open",
        "driver": {
          "user_id": 9,
          "first_name": "Driver",
          "last_name": "Example"
        }
      }
    }
  ]
}
```

### Notes

- Trip and driver are eager-loaded in the service layer to avoid N+1
queries during serialization.
- This endpoint intentionally returns nested trip metadata to avoid
extra frontend calls when rendering item cards.

## Authentication

- **Method**: Session-based via Flask-Login
- **Storage**: Server-side session with cookie
- **Cookie config**: HTTPOnly, Lax SameSite, 24-hour lifetime
- **Frontend usage**: Include `credentials: 'include'` on
all fetch requests to send the session cookie

## Performance Design Decisions

1. **Denormalized `claimed_quantity` on Item**: Avoids
  `SUM(order_items.quantity)` join on every trip card.
   Updated atomically with OrderItem creation.
2. **Denormalized `latitude`/`longitude` on User**: Geocoded
  once at registration. Avoids repeated geocoding API calls
   when sorting trips by distance.
3. **Strategic indexes**: On foreign keys used in common
  queries (driver_id, shopper_id, trip_id, status) and
   a composite index on (status, lat, lng) for the
   distance-sorted trip feed.

## Tech Stack


| Layer    | Technology                   |
| -------- | ---------------------------- |
| Frontend | React                        |
| Backend  | Python 3.12, Flask 3.1       |
| ORM      | SQLAlchemy 2.0               |
| Auth     | Flask-Login (session-based)  |
| Database | SQLite                       |
| Testing  | pytest, pytest-cov (85% min) |
| Linting  | flake8, Black (79 chars)     |
| CI/CD    | GitHub Actions               |


---

*This document is updated as the architecture evolves.*