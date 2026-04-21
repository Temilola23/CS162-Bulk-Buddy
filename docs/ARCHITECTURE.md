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
│  │  Route Guards:                                           │  │
│  │  ┌──────────────┐ ┌──────────────┐ ┌──────────────────┐  │  │
│  │  │ProtectedRoute│ │ DriverRoute  │ │   AdminRoute     │  │  │
│  │  └──────────────┘ └──────────────┘ └──────────────────┘  │  │
│  │                                                          │  │
│  │  Shopper Pages:                                          │  │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌────────────┐   │  │
│  │  │ Landing  │ │  Login   │ │ Register │ │  TripFeed  │   │  │
│  │  └──────────┘ └──────────┘ └──────────┘ └────────────┘   │  │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌────────────┐   │  │
│  │  │ ItemFeed │ │   Cart   │ │ MyOrders │ │TripDetail  │   │  │
│  │  └──────────┘ └──────────┘ └──────────┘ └────────────┘   │  │
│  │  ┌──────────┐ ┌──────────┐                               │  │
│  │  │ Profile  │ │Settings  │                               │  │
│  │  └──────────┘ └──────────┘                               │  │
│  │                                                          │  │
│  │  Driver Pages:                                           │  │
│  │  ┌─────────────────────────────────────────────────┐     │  │
│  │  │             DriverTrips (PostTrip)              │     │  │
│  │  └─────────────────────────────────────────────────┘     │  │
│  │                                                          │  │
│  │  Admin Pages:                                            │  │
│  │  ┌──────────┐ ┌──────────────────┐ ┌──────────────────┐  │  │
│  │  │AdminLogin│ │AdminApplications │ │ ApplicationReview│  │  │
│  │  └──────────┘ └──────────────────┘ └──────────────────┘  │  │
│  │                                                          │  │
│  │  Shared Components:                                      │  │
│  │  ┌──────────────┐ ┌────────────┐ ┌───────────────────┐   │  │
│  │  │ShopperHeader │ │CartDrawer  │ │   AdminShell      │   │  │
│  │  └──────────────┘ └────────────┘ └───────────────────┘   │  │
│  │                                                          │  │
│  │  Contexts:                                               │  │
│  │  ┌─────────────────┐ ┌──────────────┐ ┌─────────────┐    │  │
│  │  │ SessionProvider │ │ CartProvider │ │ ApiProvider │    │  │
│  │  └─────────────────┘ └──────────────┘ └─────────────┘    │  │
│  └────────────────────────┬─────────────────────────────────┘  │
│                           │ HTTP JSON + Session Cookie         │
└───────────────────────────┼────────────────────────────────────┘
                            │
                            ▼
┌────────────────────────────────────────────────────────────────┐
│                     FLASK BACKEND                              │
│                                                                │
│  Middleware (before/after_request):                            │
│  - Reject non-JSON Content-Type on POST/PUT/PATCH /api/*       │
│  - Add security headers (X-Content-Type-Options, etc.)         │
│                                                                │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │                Routes (Blueprints)                       │  │
│  │                                                          │  │
│  │  Auth (/api)                                             │  │
│  │    POST /api/signup           Register shopper           │  │
│  │    POST /api/login            Authenticate + session     │  │
│  │    POST /api/logout           End session                │  │
│  │                                                          │  │
│  │  Admin (/admin)                                          │  │
│  │    POST /admin/register       Create admin (token-gated) │  │
│  │    POST /admin/login          Admin login                │  │
│  │    POST /admin/logout         Admin logout               │  │
│  │    GET  /admin/pending        Pending applications       │  │
│  │    GET  /admin/approved       Approved applications      │  │
│  │    GET  /admin/rejected       Rejected applications      │  │
│  │    PUT  /admin/decision/<id>  Approve or reject app      │  │
│  │                                                          │  │
│  │  Driver (/api)                                           │  │
│  │    POST /api/driver/apply     Submit driver application  │  │
│  │                                                          │  │
│  │  Trips (/api)                                            │  │
│  │    GET  /api/trips            Browse OPEN trips (feed)   │  │
│  │    GET  /api/trips/<id>       Trip detail with items     │  │
│  │    GET  /api/inventory        Available items (all trips)│  │
│  │    GET  /api/me/trips         Driver's own trips         │  │
│  │    POST /api/me/trips         Create trip with items     │  │
│  │    PUT  /api/me/trips/<id>    Edit OPEN trip             │  │
│  │    PATCH .../close            OPEN → CLOSED              │  │
│  │    PATCH .../purchase         CLOSED → PURCHASED         │  │
│  │    PATCH .../ready-for-pickup PURCHASED → READY          │  │
│  │    PATCH .../complete         READY_FOR_PICKUP → DONE    │  │
│  │    PATCH .../cancel           Any → CANCELLED (cascade)  │  │
│  │    GET  /api/me/trips/<id>/orders  Orders on a trip      │  │
│  │                                                          │  │
│  │  Orders + Profile (/api/me)                              │  │
│  │    GET  /api/me               User profile + driver app  │  │
│  │    PUT  /api/me               Update profile fields      │  │
│  │    GET  /api/me/orders        Shopper's orders (?status) │  │
│  │    POST /api/me/orders        Create or update order     │  │
│  │    PATCH .../orders/<id>/cancel    Cancel CLAIMED order  │  │
│  │    PATCH .../orders/<id>/complete  Complete READY order  │  │
│  └───────────────────────┬──────────────────────────────────┘  │
│                          │                                     │
│  ┌───────────────────────▼──────────────────────────────────┐  │
│  │                   Services Layer                         │  │
│  │                                                          │  │
│  │  auth_service         authenticate, register, logout     │  │
│  │  admin_service        list and decide driver apps        │  │
│  │  driver_service       submit driver application          │  │
│  │  trip_service         create/list/edit/status trips      │  │
│  │  order_service        create/cancel/complete orders      │  │
│  │  inventory_service    get available items across trips   │  │
│  │  user_service         get and update user profile        │  │
│  │                                                          │  │
│  │  Responsibilities:                                       │  │
│  │  - Input validation (clear error messages)               │  │
│  │  - Business rules (status transitions, oversell check,   │  │
│  │    duplicate guard, ownership enforcement)               │  │
│  │  - Database transactions (atomic updates)                │  │
│  │  - Return (result, error_msg, status_code) tuples        │  │
│  └───────────────────────┬──────────────────────────────────┘  │
│                          │                                     │
│  ┌───────────────────────▼──────────────────────────────────┐  │
│  │                   Models (SQLAlchemy ORM)                │  │
│  │                                                          │  │
│  │  User ──1:N──▶ Trip ──1:N──▶ Item                        │  │
│  │  User ──1:N──▶ Order ──1:N──▶ OrderItem ◀──N:1── Item    │  │
│  │  User ──1:N──▶ DriverApplication                         │  │
│  │  Trip ──1:N──▶ Order                                     │  │
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

**Example: Shopper places an order**

```
1. Frontend sends POST /api/me/orders
   Body: { "trip_id": 5, "items": [{ "item_id": 12, "quantity": 3 }] }

2. Middleware:
   - Validates Content-Type is application/json

3. Route (me blueprint):
   - Checks @login_required
   - Extracts and passes JSON body to order_service

4. Service (order_service.create_order):
   - Validates trip exists and is OPEN
   - Validates shopper is not the trip's driver
   - Checks each item has enough available_quantity
   - If existing non-cancelled order found: updates it (returns 200)
   - Otherwise in a single transaction:
     a. Creates Order (status=CLAIMED)
     b. Creates OrderItem rows
     c. Increments item.claimed_quantity for each line item
   - Returns (order, None, 201)

5. Route returns JSON response:
   { "order_id": 42, "status": "claimed", "items": [...] }
```

## Entity Relationship Diagram

```
┌─────────────────────────────┐
│            users            │
├─────────────────────────────┤
│ user_id          (PK)       │
│ email            UNIQUE     │
│ password_hash               │
│ first_name                  │
│ last_name                   │
│ role             enum       │──────────────────────────────┐
│ address_street              │                              │
│ address_city                │                              │
│ address_state               │                              │
│ address_zip                 │                              │
│ latitude         nullable   │                              │
│ longitude        nullable   │                              │
│ created_at                  │                              │
│ updated_at                  │                              │
└────────┬──────────┬─────────┘                              │
         │          │                                        │
    1:N  │          │ 1:N (as driver)                   1:N  │
(shopper)│          │                                        │
         │   ┌──────▼──────────────────────┐       ┌────────▼─────────────────┐
         │   │           trips             │       │    driver_applications   │
         │   ├─────────────────────────────┤       ├──────────────────────────┤
         │   │ trip_id          (PK)       │       │ driver_application_id(PK)│
         │   │ driver_id        FK→users   │       │ user_id       FK→users   │
         │   │ store_name                  │       │ status        enum       │
         │   │ pickup_location_text        │       │ license_info  nullable   │
         │   │ pickup_lat       nullable   │       │ created_at               │
         │   │ pickup_lng       nullable   │       │ updated_at               │
         │   │ pickup_time                 │       └──────────────────────────┘
         │   │ status           enum       │
         │   │ created_at                  │
         │   │ updated_at                  │
         │   └───────┬──────────┬──────────┘
         │           │          │
         │      1:N  │          │ 1:N
         │           │          │
         │   ┌───────▼──────┐   │
         │   │    items     │   │
         │   ├──────────────┤   │
         │   │ item_id  (PK)│   │
         │   │ trip_id  FK  │   │
         │   │ name         │   │
         │   │ unit         │   │
         │   │ total_quantity│  │
         │   │ claimed_qty* │   │
         │   │ price_per_unit│  │
         │   │ created_at   │   │
         │   │ updated_at   │   │
         │   └──────┬───────┘   │
         │          │           │
         │     1:N  │           │ 1:N
         │          │           │
         │   ┌──────▼───────────▼──────┐
         │   │       order_items       │
         │   ├─────────────────────────┤
         │   │ order_item_id  (PK)     │
         │   │ order_id       FK→orders│
         │   │ item_id        FK→items │
         │   │ quantity                │
         │   │ created_at              │
         │   └────────────▲────────────┘
         │                │
         │           1:N  │
         │                │
         │   ┌────────────┴────────────┐
         └──▶│          orders         │
             ├─────────────────────────┤
             │ order_id     (PK)       │
             │ shopper_id   FK→users   │
             │ trip_id      FK→trips   │
             │ status       enum       │
             │ created_at              │
             │ updated_at              │
             └─────────────────────────┘

* claimed_quantity is a denormalized counter kept in sync with
  SUM(order_items.quantity). Updated atomically in the same
  transaction as OrderItem creation/deletion.
```

## Separation of Concerns

### Frontend (React) — Presentation Layer

- Renders UI and handles user interactions
- Manages client-side routing and route guards (ProtectedRoute, DriverRoute, AdminRoute)
- Sends JSON requests to the backend API via ApiClient
- Manages cart state in sessionStorage (CartProvider) and session state (SessionProvider)
- No direct database access, no business logic

### Routes (Flask Blueprints) — API Layer

- Defines HTTP endpoints (method + path) across four blueprints: auth, admin, driver, trip/me
- Extracts request data (JSON body, query params, URL params)
- Enforces authentication via `@login_required` and `@admin_required` decorators
- Delegates all logic to the appropriate service function
- Returns JSON responses with appropriate status codes
- Applies security middleware: Content-Type enforcement, security headers

### Services — Business Logic Layer

- Contains all business rules and validation (one module per domain)
- Enforces ownership (only the driver can cancel their own trip)
- Manages status transitions and invariants (no overselling, no duplicate orders)
- Returns `(result, error_message, status_code)` tuples — routes never contain logic
- Manages database transactions (commit/rollback)

### Models (SQLAlchemy) — Data Layer

- Defines database schema via Python classes with relationships and constraints
- Provides computed properties (e.g., `item.available_quantity`)
- Validates data at the DB level (enums, nullable constraints, foreign keys) as a safety net
- Exposes `to_dict()` methods for JSON serialization; no business logic in models

### Database (SQLite) — Persistence Layer

- Stores all application data across six tables
- Accessed only through the SQLAlchemy ORM (no raw SQL in application code)
- Foreign key enforcement enabled via PRAGMA
- `ON DELETE CASCADE` on all foreign keys to maintain referential integrity
- In-memory SQLite used in the test suite for fast, isolated runs

## Status Lifecycles

### Trip Status

```
OPEN ──▶ CLOSED ──▶ PURCHASED ──▶ READY_FOR_PICKUP ──▶ COMPLETED
  │           │
  │           └──▶ CANCELLED (cascades all orders → CANCELLED,
  │                           reverts item.claimed_quantity)
  └──▶ CANCELLED

  OPEN:             accepting new orders from shoppers
  CLOSED:           no new orders; driver heading to store
  PURCHASED:        driver has bought the items
  READY_FOR_PICKUP: items available for shopper pickup
  COMPLETED:        all pickups done; terminal state
  CANCELLED:        driver cancelled; terminal state
```

### Order Status

```
CLAIMED ──▶ PURCHASED ──▶ READY_FOR_PICKUP ──▶ COMPLETED
   │
   └──▶ CANCELLED (reverts item.claimed_quantity)

  Order status is driven by parent trip status transitions:
  - Trip CLOSED → PURCHASED:        CLAIMED → PURCHASED (cascade)
  - Trip PURCHASED → READY:         PURCHASED → READY_FOR_PICKUP (cascade)
  - Trip CANCELLED:                  any non-COMPLETED → CANCELLED (cascade)
  - Shopper self-cancel:             CLAIMED → CANCELLED (manual, reverts inventory)
  - Shopper self-complete:           READY_FOR_PICKUP → COMPLETED (manual)
```

### Driver Application Status

```
PENDING ──▶ APPROVED (user.role upgraded to DRIVER)
   │
   └──▶ REJECTED (user.role stays SHOPPER; user may reapply)
```

## API Endpoints

### Auth

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/api/signup` | No | Register new shopper |
| POST | `/api/login` | No | Authenticate, create session |
| POST | `/api/logout` | Yes | End session |

### Admin

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/admin/register` | No (token-gated) | Create admin account |
| POST | `/admin/login` | No | Admin login |
| POST | `/admin/logout` | Admin | Admin logout |
| GET | `/admin/pending` | Admin | List PENDING driver applications |
| GET | `/admin/approved` | Admin | List APPROVED driver applications |
| GET | `/admin/rejected` | Admin | List REJECTED driver applications |
| PUT | `/admin/decision/<id>` | Admin | Approve or reject an application |

### Driver

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/api/driver/apply` | Yes | Submit driver application |

### Trips

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/trips` | Yes | Browse OPEN trips (excludes own) |
| GET | `/api/trips/<id>` | Yes | Trip detail with items and driver |
| GET | `/api/inventory` | Yes | Available items across all OPEN trips |
| GET | `/api/me/trips` | Driver | Driver's own trips (all statuses) |
| POST | `/api/me/trips` | Driver | Create trip with items |
| PUT | `/api/me/trips/<id>` | Driver | Edit OPEN trip |
| PATCH | `/api/me/trips/<id>/close` | Driver | OPEN → CLOSED |
| PATCH | `/api/me/trips/<id>/purchase` | Driver | CLOSED → PURCHASED |
| PATCH | `/api/me/trips/<id>/ready-for-pickup` | Driver | PURCHASED → READY_FOR_PICKUP |
| PATCH | `/api/me/trips/<id>/complete` | Driver | READY_FOR_PICKUP → COMPLETED |
| PATCH | `/api/me/trips/<id>/cancel` | Driver | Any → CANCELLED (cascade) |
| GET | `/api/me/trips/<id>/orders` | Driver | Non-cancelled orders on trip |

### Orders & Profile

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/me` | Yes | Current user profile + latest driver app |
| PUT | `/api/me` | Yes | Update profile fields |
| GET | `/api/me/orders` | Yes | Shopper's orders (optional `?status=` filter) |
| POST | `/api/me/orders` | Yes | Create or update order on a trip |
| PATCH | `/api/me/orders/<id>/cancel` | Yes | Cancel CLAIMED order, revert inventory |
| PATCH | `/api/me/orders/<id>/complete` | Yes | Mark READY_FOR_PICKUP order complete |

## Performance Design Decisions

1. **Denormalized `claimed_quantity` on Item**: Avoids `SUM(order_items.quantity)`
   join on every trip card. Updated atomically when an OrderItem is created or cancelled.
2. **Denormalized `latitude`/`longitude` on User**: Geocoded once at registration;
   avoids repeated geocoding API calls when sorting trips by distance.
3. **Strategic indexes**: On foreign keys used in common queries (`driver_id`,
   `shopper_id`, `trip_id`, `status`) and a composite index on
   `(status, pickup_lat, pickup_lng)` for the distance-sorted trip feed.
4. **Eager-loading in inventory_service**: Trip and driver are joined in one query
   to avoid N+1 queries when serializing item cards with trip metadata.
5. **Cart in sessionStorage**: Cart state is maintained on the frontend, persisted
   per user email in `sessionStorage`. Reduces backend round trips during browsing.

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | React 19 (create-react-app) |
| Backend | Python 3.12, Flask 3.1 |
| ORM | SQLAlchemy 2.0 |
| Auth | Flask-Login (session-based, HTTP-only cookie) |
| Database | SQLite |
| Testing (backend) | pytest, pytest-cov (85% minimum coverage) |
| Testing (frontend) | Jest |
| Linting | flake8, Black (79 chars max line length) |
| CI/CD | GitHub Actions (lint + test on every PR to main) |
| Deployment | Docker Compose (backend :5001, frontend :3000) |

## Deployment

```
docker-compose up
  ├── backend  (Flask, port 5001)  ← FLASK_APP, SECRET_KEY, ADMIN_TOKEN
  └── frontend (React, port 3000)  ← REACT_APP_API_URL, proxy → backend
```

Environment variables are documented in `.env.example`. No third-party API keys
are required to run the application.

---

*Last updated to reflect the full production codebase as of April 2026.*
