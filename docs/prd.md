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
- The shopper experience centers on authenticated trip browsing, checkout, and order review
- The Trip Feed shows currently open trips and sorts them by distance using the current frontend implementation
- Checkout creates persisted orders that shoppers can review in `My Orders`
- Driver trip management is separated from the shopper Trip Feed through a dedicated `My Trips` feed in MVP2

Note: This project uses Option A and does not implement Option B (city dropdown).

## 4. Current Product Scope

### 4.1 In Scope

- Sign up / Login / Logout
- Default role is Shopper; users can apply to become Driver
- Shopper can browse open trips and review trip details
- Shopper can select item quantities and create orders through checkout
- Shopper can review their own orders in `My Orders`
- Shopper can open linked trip detail from order history
- Users can view and update their account information in `Profile` / `Settings`
- Shoppers can submit a driver application
- MVP1 includes frontend admin pages for driver-application review
- MVP2 adds a dedicated driver `My Trips` feed
- MVP2 adds a checkout confirmation pop-up, redirect to `My Orders`, aggregated inventory view, and duplicate order guard

### 4.2 Deferred / Out of Scope for the Current PRD

- In-app chat
- Rating system
- Real third-party payment charge
- Route optimization
- Audit logging system
- Production monitoring/alerting system
- Address geocoding and backend radius filtering
- Frontend driver trip creation / editing / close controls
- Full multi-step order status management beyond the current checkout and completion flow
- Strong multi-worker concurrency guarantees beyond current course-scale SQLite usage

## 5. Roles and Permissions
| Feature | Not Logged In | Shopper | Driver (Verified) | Admin |
|---|---|---|---|---|
| Browse trips | No | Yes | Yes | Yes |
| View trip details | No | Yes | Yes | Yes |
| Checkout / create order | No | Yes | Yes | No |
| View own orders | No | Yes | Yes | No |
| Submit driver application | No | Yes | No | No |
| View dedicated `My Trips` feed | No | No | Yes | No |
| Review aggregated inventory in `My Trips` | No | No | Yes | No |
| Update own profile/settings | No | Yes | Yes | Yes |
| Use admin frontend pages | No | No | No | Yes |
| Use admin review APIs (backend only) | No | No | No | Yes |

## 6. Core Flows

### 6.1 Shopper Flow

1. Register with address
2. Log in to the protected shopper experience
3. Browse open trips in the Trip Feed
4. Open Trip Detail and review pickup information, driver information, and item availability
5. Select item quantities and complete checkout
6. See checkout confirmation and land on `My Orders`
7. Review the newly created order and linked trip detail

### 6.2 Driver Flow

1. Register as a shopper and submit a driver application
2. After approval, access the dedicated `My Trips` feed
3. Review only the driver's own trips
4. Review aggregated inventory for each trip without mixing this view into the shopper Trip Feed

### 6.3 Admin Flow

- Admin authentication and review endpoints exist on the backend
- MVP1 includes frontend admin pages for reviewing driver applications
- The admin frontend supports pending, approved, and rejected application views plus approve/reject actions

## 7. Functional Requirements (FR)

### FR-1 Authentication

- Support email sign-up/login
- Address required at registration (`street/city/state/zip`)
- New user default role is `shopper`
- Support logout
- Protected shopper pages require an authenticated session

### FR-2 Trip Feed and Distance Presentation

- The Trip Feed shows only trips whose status is `open`
- Trips are presented in ascending distance order using the current frontend distance calculation
- Backend radius filtering is not required in MVP1
- The product may use stored coordinates when available, but geocoding is not a current MVP1/MVP2 requirement

### FR-3 Driver Verification

- Shopper can submit driver application
- The current driver application captures license information for review
- Status: `pending/approved/rejected`
- A user who is already a driver cannot submit another driver application
- A user with an existing pending application cannot submit another pending application
- Only `approved` drivers can access driver-only trip endpoints

### FR-4 Trips and Driver Views

- Trips store `store_name`, `pickup_location_text`, `pickup_lat`, `pickup_lng`, and `pickup_time`
- Trip records support status values `open`, `closed`, `completed`, and `cancelled`
- Driver trip data exists separately from the shopper Trip Feed
- MVP2 introduces a dedicated driver `My Trips` feed for reviewing the driver's own trips
- Aggregated inventory is displayed from trip-level item data inside `My Trips`
- Frontend trip creation and trip-editing workflows are deferred until explicitly scheduled

### FR-5 Items, Cart, and Checkout

- Driver trip items use `name`, `unit`, `total_quantity`, `claimed_quantity`, and optional `price_per_unit`
- Item field definitions:
  - `name`: shopper-facing item label (example: "Chicken Breast")
  - `unit`: shopper-facing unit label (examples: `lb`, `pack`, `box`, `each`)
  - `total_quantity`: maximum available quantity for that trip item
  - `claimed_quantity`: already reserved quantity (system-maintained)
- Shoppers can select item quantities only from trips with status `open`
- Checkout quantities must be positive integers and cannot exceed the currently available quantity
- Checkout creates persisted order records
- The current flow creates one order per trip represented in the shopper's cart
- MVP2 shows a confirmation pop-up after successful checkout and then redirects the shopper to `My Orders`
- MVP2 must guard against duplicate checkout submission creating unintended duplicate orders

### FR-6 Order Status Handling

- Orders are created in `claimed` status
- Shoppers can mark their own non-cancelled orders as `completed`
- A shopper cannot update another shopper's order
- Intermediate statuses present in the data model are not required for the current frontend MVP flow

### FR-7 My Pages

- Shopper can view only their own orders in `My Orders`
- Each order entry can link to a trip-detail review view
- Users can view current account details in `Profile`
- Users can update editable account details in `Settings`
- MVP2 adds a dedicated driver `My Trips` page with aggregated inventory

### FR-8 Trip Feed, Trip Detail, and Checkout UX Requirements

- Trip Feed cards must show at minimum: driver display name, pickup location text, pickup time, and distance
- Trip Detail must show at minimum: driver information, pickup location, pickup time, item list, and each item's available quantity
- Checkout is available only for trips with status `open`
- The shopper Trip Feed must not include driver `My Trips` content once MVP2 separation is implemented
- After successful checkout, the shopper sees a confirmation pop-up and is redirected to `My Orders`

### FR-9 Admin Scope

- Admin authentication and driver-application review APIs exist on the backend
- MVP1 includes admin frontend pages for reviewing pending, approved, and rejected driver applications
- Operator tracking UI is not a current acceptance requirement

## 8. Data Model (Simplified)

### User

- id, email, password_hash, role
- address_street/city/state/zip
- latitude, longitude (optional)

### Trip

- id, driver_id
- store_name, pickup_location_text, pickup_lat, pickup_lng, pickup_time
- status (`open/closed/completed/cancelled`)

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
- `GET /api/me/orders`
- `POST /api/me/orders`
- `PATCH /api/me/orders/{order_id}/complete`
- `POST /api/driver/apply`
- `GET /api/me/trips`
- `POST /api/me/trips`
- `PUT /api/me/trips/{trip_id}`
- `PATCH /api/me/trips/{trip_id}/close`
- `PATCH /api/me/trips/{trip_id}/complete`
- `PATCH /api/me/trips/{trip_id}/cancel`
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
- `total_quantity`: total quantity listed for a trip item
- `claimed_quantity`: quantity already reserved by shoppers
- `available_quantity`: `total_quantity - claimed_quantity`
- `order`: a shopper's persisted checkout against one trip
- `order item`: one quantity selection inside an order
- `aggregated inventory view`: a driver-facing summary of trip inventory derived from the trip's item quantities and claimed quantities

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
