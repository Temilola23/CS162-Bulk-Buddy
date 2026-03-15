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
│  │  /api/trips     GET    Browse nearby open trips (planned)│  │
│  │  /api/trips     POST   Create trip + items     (planned) │  │
│  │  /api/trips/:id PATCH  Edit/close/complete     (planned) │  │
│  │  /api/trips/:id/claims  POST  Claim items      (planned) │  │
│  │  /api/claims/:id/status PATCH Update status    (planned) │  │
│  │  /api/me/trips  GET    Driver's trips          (planned) │  │
│  │  /api/me/claims GET    Shopper's orders        (planned) │  │
│  │  /api/driver/apply      POST  Apply to drive   (planned) │  │
│  │                                                          │  │
│  │  /health        GET    Health check                      │  │
│  └───────────────────────┬──────────────────────────────────┘  │
│                          │                                     │
│  ┌───────────────────────▼──────────────────────────────────┐  │
│  │                   Services Layer                         │  │
│  │                                                          │  │
│  │  auth_service     authenticate, register, logout         │  │
│  │  trip_service     create, list, close, complete (planned)│  │
│  │  order_service    claim items, update status    (planned)│  │
│  │  driver_service   apply, approve, reject        (planned)│  │
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
  │
  └── Driver closes trip when heading to store
       └── Driver marks completed after all pickups done
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


| Method | Path          | Auth | Description            |
| ------ | ------------- | ---- | ---------------------- |
| POST   | `/api/signup` | No   | Register new user      |
| POST   | `/api/login`  | No   | Log in, create session |
| POST   | `/api/logout` | Yes  | End session            |
| GET    | `/health`     | No   | Health check           |


### Planned


| Method | Path                                 | Auth    | Description              |
| ------ | ------------------------------------ | ------- | ------------------------ |
| GET    | `/api/trips`                         | Yes     | Browse nearby open trips |
| POST   | `/api/trips`                         | Driver  | Create trip with items   |
| PATCH  | `/api/trips/:id`                     | Driver  | Edit/close/complete trip |
| POST   | `/api/trips/:id/claims`              | Shopper | Claim items              |
| PATCH  | `/api/claims/:id/status`             | Driver  | Update order status      |
| GET    | `/api/me/trips`                      | Driver  | Driver's trips           |
| GET    | `/api/me/claims`                     | Shopper | Shopper's orders         |
| POST   | `/api/driver/apply`                  | Shopper | Apply to become driver   |
| PATCH  | `/api/admin/driver-applications/:id` | Admin   | Review application       |


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