# Bulk Buddy PRD

## 1. Document Goal

This PRD is for the CS162 course project and is not intended for real production users.
The goal is to let teammates directly implement, test, and deliver based on this document.

## 2. Project Background

Bulk Buddy solves this problem: users without cars want to participate in bulk buying but lack an efficient coordination method.
The platform connects:

- Shopper (users without cars)
- Driver (users with cars who already plan to go to warehouse stores)

## 3. Core Product Decision

- Address is required during registration
- Registration also requires first name and last name
- The shopper experience centers on authenticated trip browsing, item claiming, cart review, checkout, and order review
- The product supports two browsing surfaces:
  - `Trip Feed` for browsing nearby open trips and selecting items within a trip
  - `Item Feed` for browsing all currently claimable inventory across open trips
- The `Trip Feed` shows open trips and sorts them by distance
- The `Item Feed` is powered by inventory availability and lets shoppers create or update an order directly from an item card
- Checkout creates or updates persisted orders; one shopper can have one active non-cancelled order per trip
- Driver trip management is separated from the shopper browsing experience through a dedicated driver-only `Post Trip / My Trips` surface
- The trip and order lifecycle includes `claimed`, `purchased`, `ready_for_pickup`, `completed`, and `cancelled` states

Note: This project uses Option A and does not implement Option B (city dropdown).

## 4. Current Product Scope

### 4.1 In Scope

- Sign up / Login / Logout
- Default role is Shopper; users can apply to become Driver
- Shopper can browse open trips and review trip details in the authenticated experience
- Shopper can browse open claimable inventory through `Item Feed`
- Shopper can add selected trip items to a cart grouped by trip
- Shopper can create orders through cart checkout
- Shopper can also create or update an order directly from `Item Feed`
- Shopper can review their own orders in `My Orders`
- Shopper can open linked trip detail from order history
- Shopper can cancel their own claimed orders
- Shopper can complete their own ready-for-pickup orders
- Users can view and update their account information in `Profile` / `Settings`
- Shoppers can submit a driver application
- Verified drivers can create trips with item lists
- Verified drivers can review and manage their own trips in `My Trips`
- Verified drivers can advance trip status through close, purchased, ready-for-pickup, complete, and cancel actions
- Verified drivers can review non-cancelled shopper orders for their own trips
- Admin authentication and driver-application review are in scope
- Admin review pages support pending, approved, and rejected application views plus approve/reject actions

### 4.2 Deferred / Out of Scope for the Current PRD

- In-app chat
- Rating system with real persisted reviews
- Real third-party payment charge
- Route optimization
- Audit logging system
- Production monitoring/alerting system
- Address geocoding and backend radius filtering
- Dedicated frontend trip editing workflow
- Rich driver profile metadata such as real vehicle details or reputation scores
- Structured driver-license storage beyond the `license_info` field
- Notification delivery infrastructure
- Strong multi-worker concurrency guarantees or full idempotency guarantees beyond course-scale behavior

## 5. Roles and Permissions
| Feature | Not Logged In | Shopper | Driver (Verified) | Admin |
|---|---|---|---|---|
| Browse `Trip Feed` | No | Yes | Yes | Yes |
| Browse `Item Feed` | No | Yes | Yes | Yes |
| View trip details | No | Yes | Yes | Yes |
| Add items to cart | No | Yes | Yes | No |
| Checkout / create or update order | No | Yes | Yes | No |
| View own orders | No | Yes | Yes | No |
| Cancel own claimed order | No | Yes | Yes | No |
| Complete own ready-for-pickup order | No | Yes | Yes | No |
| Submit driver application | No | Yes | No | No |
| Use dedicated `Post Trip / My Trips` surface | No | No | Yes | No |
| Create and manage own trips | No | No | Yes | No |
| Review aggregated trip orders for own trip | No | No | Yes | No |
| Update own profile/settings | No | Yes | Yes | Yes |
| Use admin frontend pages | No | No | No | Yes |
| Use admin review APIs | No | No | No | Yes |

## 6. Core Flows

### 6.1 Shopper Flow

1. Register with first name, last name, email, password, and address
2. Log in to the protected shopper experience
3. Browse open trips in `Trip Feed` or browse available inventory in `Item Feed`
4. Review pickup information, driver information, distance, and current item availability
5. Either:
   - add selected trip items to cart and then checkout, or
   - create/update an order directly from `Item Feed`
6. Review the resulting order in `My Orders`
7. Open the linked trip detail view from order history
8. Mark the order completed after the driver marks it ready for pickup

### 6.2 Driver Flow

1. Register as a shopper and submit a driver application
2. After approval, access the dedicated `Post Trip / My Trips` surface
3. Create a trip with store name, pickup location, pickup time, and trip items
4. Review only the driver's own trips
5. Advance trip status from `open` to `closed`, then `purchased`, then `ready_for_pickup`, then `completed`, or cancel before completion
6. Review non-cancelled shopper orders attached to a trip

### 6.3 Admin Flow

- Admin authentication and review endpoints are included in scope
- The admin experience supports driver-application review with pending, approved, and rejected views
- Admins can approve or reject pending driver applications

## 7. Functional Requirements (FR)

### FR-1 Authentication

- Support email sign-up/login
- Address is required at registration (`street/city/state/zip`)
- First name and last name are required at registration
- New user default role is `shopper`
- Support logout
- Protected shopper pages require an authenticated session
- Admin login uses a separate admin route namespace
- Admin registration requires an admin token

### FR-2 Trip Discovery and Distance Presentation

- The `Trip Feed` shows only trips whose status is `open`
- `GET /api/trips` excludes trips created by the authenticated user
- The `Trip Feed` is presented in ascending distance order using the product distance calculation
- `Trip Feed` includes an inline selected-trip detail panel to support fast comparison and item selection
- `GET /api/trips/{trip_id}` returns full trip detail with nested items for the selected trip
- The product uses stored coordinates when available, but geocoding is not required in this phase
- Distance presentation is based on the shopper location and the trip pickup location; when a pickup coordinate is unavailable, the system uses the best available location data for display

### FR-3 Inventory Discovery

- `GET /api/inventory` returns items from open trips with `available_quantity > 0`
- Inventory excludes items from trips owned by the authenticated user
- Each inventory item includes nested trip and driver context so the product can render a standalone item-browsing feed
- `Item Feed` allows shoppers to create a new order or add quantity to an existing active order for the same trip

### FR-4 Driver Verification

- Shopper can submit a driver application
- Driver application data is stored in a `license_info` field
- The driver application form collects license number and expiration date for review
- Status: `pending/approved/rejected`
- A user who is already a driver cannot submit another driver application
- A user with an existing pending application cannot submit another pending application
- Admin approval upgrades the user role to `driver`
- Only approved drivers can create and manage driver trips

### FR-5 Trips and Driver Views

- Trips store `store_name`, `pickup_location_text`, `pickup_lat`, `pickup_lng`, and `pickup_time`
- Trip records support status values `open`, `closed`, `purchased`, `ready_for_pickup`, `completed`, and `cancelled`
- Verified drivers can create trips with one or more items
- Driver trip data exists separately from the shopper browsing experience
- The dedicated driver view allows the driver to:
  - create a trip
  - list their trips across statuses
  - close a trip
  - mark a trip purchased
  - mark a trip ready for pickup
  - complete a trip
  - cancel a trip before completion
- `GET /api/me/trips/{trip_id}/orders` returns non-cancelled orders for that trip, including shopper name/address and claimed item quantities
- Trip editing is reserved for a future dedicated trip-management workflow

### FR-6 Items, Cart, and Checkout

- Driver trip items use `name`, `unit`, `total_quantity`, `claimed_quantity`, and optional `price_per_unit`
- Item field definitions:
  - `name`: shopper-facing item label
  - `unit`: shopper-facing unit label (examples: `lb`, `pack`, `box`, `each`)
  - `total_quantity`: maximum available quantity for that trip item
  - `claimed_quantity`: already reserved quantity (system-maintained)
- Shoppers can select item quantities only from trips with status `open`
- Claimed quantities must be positive integers and cannot exceed current availability
- The cart is grouped by driver trip
- Cart contents are session-scoped and stored per signed-in shopper in browser session storage
- Cart checkout sends one order request per trip group
- The system creates one new order per shopper/trip pair only when no active non-cancelled order exists
- If an active non-cancelled order already exists for that shopper/trip pair, new claims are merged into that order instead of creating a second active order
- Checkout prevents repeat submission while a request is in flight

### FR-7 Order Status Handling

- Orders are created in `claimed` status
- Driver trip status transitions cascade to shopper orders:
  - `closed` keeps order status at `claimed`
  - `purchased` advances matching claimed orders to `purchased`
  - `ready_for_pickup` advances matching purchased orders to `ready_for_pickup`
- Shoppers can cancel only their own `claimed` orders
- Cancelling a claimed order reverts inventory by decrementing item `claimed_quantity`
- Drivers cancelling a trip also cancel matching non-finalized orders and revert inventory where applicable
- Shoppers can mark only their own `ready_for_pickup` orders as `completed`
- A shopper cannot update another shopper's order

### FR-8 My Pages and Account Management

- Shopper can view only their own orders in `My Orders`
- `My Orders` supports upcoming/past bucketing and date-based order navigation
- Each order entry can link to a trip-detail review view
- Users can view account details in `Profile`
- Users can update editable account details in `Settings`
- Editable account fields include display name, email, and address fields
- `Settings` also exposes nearby-radius and notification preferences as part of the account-management experience
- `Profile` surfaces the latest driver-application status and unlocks `Post Trip` access only for approved drivers

### FR-9 Shopper Browsing, Trip Detail, and Checkout UX Requirements

- `Trip Feed` cards must show at minimum: driver display name, pickup location text, pickup time, and distance
- The selected `Trip Feed` detail panel must show at minimum: driver information, pickup location, pickup time, item list, and each item's available quantity
- `Item Feed` cards must show at minimum: item name, store, pickup time, driver, pickup location, distance, approximate unit price, and shopper order context
- Checkout is available only for trips with status `open`
- The shopper browsing experience must remain separate from the driver-only management surface
- The cart page must show grouped trip review before checkout
- The linked `Trip Detail` page must show order status progression and claimed item detail

### FR-10 Admin Scope

- Admin authentication and driver-application review APIs are in scope
- Admin registration is protected by token verification
- The admin experience includes:
  - login
  - register
  - list views for pending, approved, and rejected applications
  - a detail/review view for a selected application
  - approve/reject actions
- Operator tracking UI is not an acceptance requirement for this phase

## 8. Data Model (Simplified)

### User

- id, email, password_hash, role
- first_name, last_name
- address_street/city/state/zip
- latitude, longitude (optional)

### Trip

- id, driver_id
- store_name, pickup_location_text, pickup_lat, pickup_lng, pickup_time
- status (`open/closed/purchased/ready_for_pickup/completed/cancelled`)

### Item

- id, trip_id
- name, unit, price_per_unit
- total_quantity, claimed_quantity

### Order

- id, shopper_id, trip_id
- status (`claimed/purchased/ready_for_pickup/completed/cancelled`)

### OrderItem

- id, order_id, item_id
- quantity

### DriverApplication

- driver_application_id, user_id
- license_info
- status (`pending/approved/rejected`)
- created_at, updated_at

## 9. API List (Implementation Reference)

- `POST /api/signup`
- `POST /api/login`
- `POST /api/logout`
- `GET /api/me`
- `PUT /api/me`
- `GET /api/trips`
- `GET /api/trips/{trip_id}`
- `GET /api/inventory`
- `GET /api/me/orders`
- `POST /api/me/orders`
- `PATCH /api/me/orders/{order_id}/cancel`
- `PATCH /api/me/orders/{order_id}/complete`
- `POST /api/driver/apply`
- `GET /api/me/trips`
- `POST /api/me/trips`
- `PUT /api/me/trips/{trip_id}`
- `PATCH /api/me/trips/{trip_id}/close`
- `PATCH /api/me/trips/{trip_id}/purchase`
- `PATCH /api/me/trips/{trip_id}/ready-for-pickup`
- `PATCH /api/me/trips/{trip_id}/complete`
- `PATCH /api/me/trips/{trip_id}/cancel`
- `GET /api/me/trips/{trip_id}/orders`
- Backend admin APIs:
  - `POST /admin/login`
  - `POST /admin/register`
  - `POST /admin/logout`
  - `GET /admin/pending`
  - `GET /admin/approved`
  - `GET /admin/rejected`
  - `PUT /admin/decision/{app_id}`

## 9.1 Domain Glossary (To Avoid Ambiguity)

- `unit`: shopper-visible measurement label for an item quantity (such as `lb`, `pack`, `each`)
- `claimed_quantity`: quantity already reserved on a trip item across active orders
- `available_quantity`: `total_quantity - claimed_quantity`
- active order: the shopper's current non-cancelled order for a given trip
- `Trip Feed`: shopper page for browsing nearby open trips
- `Item Feed`: shopper page for browsing all currently claimable inventory across open trips


## 10. Inventory Consistency and Checkout Notes

### 10.1 V1 Database Assumption (MVP1)

- V1 uses **SQLite** as the primary database.
- The current implementation targets local/dev and course-scale usage.
- SQLite is acceptable for the current MVP1 flow and early MVP2 work.

### 10.2 Current Order Creation Pattern

The current order-creation flow follows this application pattern:

1. Read the target trip and confirm it is `open`
2. Read the selected items and compute each item's `available_quantity`
3. Validate each submitted quantity
4. Create the `Order`
5. Create the related `OrderItem` rows
6. Update each item's `claimed_quantity`
7. Commit the transaction

If validation fails, return business conflict error (409).

### 10.3 Limitation and Upgrade Path (MVP2/MVP3)

- For MVP1 and early MVP2, SQLite is acceptable for course-scale traffic and single-instance deployment.
- The current implementation is intended to prevent basic inventory over-allocation in normal single-instance use, but stronger concurrency guarantees are not a current MVP1 acceptance requirement.
- MVP2 includes duplicate order guard as part of checkout hardening.
- If a future MVP2/MVP3 inventory-consistency acceptance criterion must hold under higher concurrency (multi-worker or multi-instance deployment), the team should migrate to PostgreSQL in MVP2 or MVP3.
- PostgreSQL target approach:
  - Keep transactional order-creation flow
  - Use row-level locking or equivalent atomic update strategy
  - Re-run concurrency tests to confirm no over-allocation under parallel checkout

## 11. Acceptance Criteria (AC)

### 11.1 MVP1 Acceptance Criteria

- AC-MVP1-1: A user can register with email and password, and registration requires `first_name`, `last_name`, `email`, `password`, `address_street`, `address_city`, `address_state`, and `address_zip`.
- AC-MVP1-2: A newly registered user is assigned the default role `shopper`.
- AC-MVP1-3: A user can log in and log out successfully; unauthenticated access to protected pages or protected APIs is rejected.
- AC-MVP1-4: The frontend protects at least these routes: `Trip Feed`, `My Orders`, `Trip Detail`, `Profile`, and `Settings`; unauthenticated users attempting to access them are redirected to the login page.
- AC-MVP1-5: The system can return the current authenticated user profile and the user's most recent driver application status from the current session.
- AC-MVP1-6: The `Trip Feed` displays only trips whose status is `open`.
- AC-MVP1-7: Trips in the `Trip Feed` are displayed in ascending distance order using the current frontend distance calculation; MVP1 does not require backend radius filtering.
- AC-MVP1-8: The `Trip Detail` page displays the trip's core information, including driver information, pickup location, pickup time, and the list of items.
- AC-MVP1-9: Each item displayed in `Trip Detail` includes at least `name`, `unit`, and `available_quantity`, and allows the shopper to select a quantity.
- AC-MVP1-10: A shopper can place an order on an `open` trip; each submitted item quantity must be a positive integer and must not exceed the currently available inventory.
- AC-MVP1-11: When an order is created successfully, the system persists the order and its associated order items, and updates each item's `claimed_quantity`.
- AC-MVP1-12: A shopper can view only their own orders; the `My Orders` page returns and displays only orders belonging to the authenticated user.
- AC-MVP1-13: A shopper can mark their own non-cancelled order as `completed`; a shopper cannot update another user's order.
- AC-MVP1-14: A trip whose status is not `open` cannot be checked out or claimed.
- AC-MVP1-15: A user can update editable profile data through `Settings` / `Profile`, including at least display name, email, and address fields.
- AC-MVP1-16: A shopper can submit a driver application; a user who is already a driver, or who already has a pending driver application, cannot submit another pending application.
- AC-MVP1-17: An admin can access frontend admin pages to review pending, approved, and rejected driver applications and submit approve/reject decisions.

### 11.2 MVP2 Acceptance Criteria

- AC-MVP2-1: The app provides a dedicated `My Trips` feed for drivers to review their own trips.
- AC-MVP2-2: The shopper-facing `Trip Feed` no longer includes `My Trips` content or driver trip-management content.
- AC-MVP2-3: A shopper can complete checkout from selected trip items and create the corresponding order successfully.
- AC-MVP2-4: After successful checkout, the app shows a confirmation pop-up before redirecting the shopper to `My Orders`.
- AC-MVP2-5: After the checkout confirmation flow completes, the shopper is redirected to `My Orders` and can see the newly created order there.
- AC-MVP2-6: The driver `My Trips` feed includes an aggregated inventory view for each trip.
- AC-MVP2-7: The aggregated inventory view shows inventory at the trip level rather than only as isolated item rows.
- AC-MVP2-8: Duplicate checkout submissions are guarded so the same checkout action does not create unintended duplicate orders.

## 12. Three-Version Roadmap (Required by course)

The project must deliver 3 versions (MVP1/MVP2/MVP3) with GitHub tags (`mvp-1`, `mvp-2`, `mvp-3`). Development must be distributed across the term, not concentrated in the final week.

### 12.1 Version 1: MVP1 (Foundation)

- Timeline: Week 1-2
- Goal: deliver the currently implemented shopper experience from account creation through order review
- Scope:
  - Sign up / Login / Logout
  - New users can create an account with required address fields and then authenticate into the app
  - The shopper-facing pages are protected so unauthenticated users must log in before viewing trip and order data
  - The Trip Feed shows currently open trips and presents them in distance-sorted order using the current frontend implementation
  - Shoppers can open a Trip Detail view to review pickup information, driver information, and item availability
  - Shoppers can select item quantities and create an order from an open trip
  - Shoppers can review their own order history in `My Orders`
  - Shoppers can open a linked trip-detail view from their order history to review the associated trip and item information
  - Users can view their current account information in `Profile`
  - Users can update editable account information in `Settings`
  - Shoppers can submit a driver application for review
  - Admins can use frontend admin pages to review driver applications and submit approval decisions
- GitHub Tag: `mvp-1`
- Demo focus:
  - Account creation, login, trip browsing, order creation, reviewing own orders, and admin application review
- Exit criteria:
  - All `AC-MVP1-*` criteria pass
  - At least one recordable end-to-end demo segment

### 12.2 Version 2: MVP2 (Checkout + My Trips)

- Timeline: Week 3-5
- Goal: separate driver trip management from the shopper feed and complete the checkout flow through post-checkout order review
- Scope:
  - Implement a dedicated driver `My Trips` feed
  - Remove `My Trips` content from the shopper-facing `Trip Feed`
  - Implement checkout from the trip selection flow
  - Show a confirmation pop-up after successful checkout
  - Redirect the shopper to `My Orders` after checkout confirmation
  - Add an aggregated inventory view in `My Trips`
  - Fix duplicate order guard for checkout submission
- GitHub Tag: `mvp-2`
- Demo focus:
  - Driver opens `My Trips`, shopper checks out successfully, sees confirmation, and lands on `My Orders`
- Exit criteria:
  - All `AC-MVP2-*` criteria pass

### 12.3 Version 3: MVP3 Final (Submission)

- Timeline: Week 6-8
- Goal: stabilize product and complete all course deliverables
- Scope:
  - Bug fixing and stabilization
  - UI/UX polish (without expanding core scope)
  - Final demo and submission materials
  - If needed from MVP2 decision: complete PostgreSQL migration for stronger inventory-consistency guarantees
- GitHub Tag: `mvp-3`
- Demo focus:
  - Full flow + tech stack + deployment + MVP evolution
- Exit criteria:
  - All AC pass
  - Demo video can be recorded end-to-end in one run
  - Individual PDF materials are complete

### 12.4 8-Week Plan (Aligned to 3 Versions)

- Week 1: Requirement freeze, task breakdown, wireframe
- Week 2: Auth + protected shopper flow + order history + admin review page + release `mvp-1`
- Week 3: Driver application flow + MVP2 planning
- Week 4: `My Trips` feed + remove `My Trips` from shopper Trip Feed
- Week 5: Checkout flow + confirmation pop-up + redirect to `My Orders` + aggregated inventory + duplicate order guard + release `mvp-2`
- Week 6: Frontend-backend integration + bug fixing + deployment strategy decision
- Week 7: Testing + final refinements + demo dry run
- Week 8: Final demo/submission, release `mvp-3`

## 13. Requirement Alignment Checklist

### 13.1 MVP Progression and Cadence

- At least 3 MVPs, with MVP3 as final version
- Each MVP must be tagged in GitHub
- Work cadence must be distributed over the term

### 13.2 LBA-Driven Change Log (Required for each version)

For each MVP release, add a change table with:

- `LBA finding`
- `Product decision` (adopt/reject)
- `Implementation change`
- `Linked PR`

### 13.3 Demo Requirements (10-12 minutes)

Must include:

- Account creation
- Login
- Major features
- Logout
- High-level tech stack and deployment
- 3-5 minutes on MVP evolution and pivot reasons

### 13.4 Final Individual PDF Requirements

Each member submits:

- Links to meaningful PRs authored by themselves
- Links to meaningful reviews authored by themselves
- Team role description (aligned with actual work)
- Architecture diagram with separation of concerns / abstraction

### 13.5 Minimum GitHub Collaboration Rules

- All features merged through PRs; no direct push to `main`
- PR must include clear description, validation/test notes, and review history
- All review comments (human or automated) must be addressed

## 14. Definition of Done (DoD)

- Features implemented according to AC
- At least basic tests or reproducible validation steps provided
- PR description is clear and reviewed
- Code is merged into `main`

## 15. Deployment Strategy (Placeholder)

This section is intentionally a placeholder and must be finalized with `@Ekene-Azubuko` before MVP3.

### 15.1 Decision Owners and Timeline

- Owners: team + `@Ekene-Azubuko`
- Decision checkpoint: by end of Week 6
- PRD update deadline: before Week 8 final MVP3 demo recording

### 15.2 Deployment Direction to Finalize

- Runtime topology: single-instance vs multi-instance for backend service
- Hosting target: course-provided environment or managed cloud platform
- Database deployment: SQLite file placement/backup for MVP2 baseline; PostgreSQL migration plan if higher concurrency is required
- Secrets and config: environment variable strategy for dev/staging/prod-like demo
- Build and release flow: manual deploy checklist vs CI/CD pipeline
- Observability baseline: minimum logs, error tracking approach, and health checks

### 15.3 MVP Expectations

- MVP1 (`mvp-1`): no production deployment required; local/dev setup is sufficient
- MVP2 (`mvp-2`): publish initial deployment decision and run at least one end-to-end demo from deployed environment
- MVP3 (`mvp-3`): lock final deployment architecture and include it in the final demo and submission materials

## 16. Team Roles and Acceptance Details

### 16.1 Role Split (Current Team Agreement)

- Tara: PM/Manager + Design
- Boss: Design
- Jonathan: Coding
- Temilola: Coding
- Ekene: Coding

### 16.2 PM/Manager Acceptance Responsibilities (Tara)

For each MVP (`mvp-1`, `mvp-2`, `mvp-3`), Tara is responsible for release-readiness sign-off before tagging.

Required acceptance checklist:

- Scope check: confirm implemented work matches PRD scope for the target MVP
- AC check: verify all relevant acceptance criteria are marked pass/fail with evidence links
- Demo check: verify required demo flow is runnable end-to-end without manual patching
- Collaboration check: verify PR descriptions, review threads, and resolved comments meet Section 13.5
- Planning check: verify next MVP backlog, owner assignment, and timeline risks are documented

Required artifacts per MVP:

- One release summary note (what shipped / what deferred / why)
- AC validation record (test steps or evidence links)
- Demo script or runbook used for recording
- Risk log updates and mitigation decisions

### 16.3 Design Acceptance Responsibilities (Tara + Boss)

- Confirm key flows are consistent across screens (auth, trip browse, checkout, my pages, and `My Trips`)
- Confirm UX changes do not expand product scope beyond PRD without explicit decision log entry
- Confirm final UI used in demo is the same version merged to main branch
