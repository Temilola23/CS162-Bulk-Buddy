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
- The system computes user location from the address
- Home page shows nearby trips (default: 5 miles)
- Trips are sorted by distance (nearest first)

Note: This project uses Option A and does not implement Option B (city dropdown).

## 4. V1 Scope
### 4.1 Must Have (P0)
- Sign up / Login / Logout
- Default role is Shopper; users can apply to become Driver
- Driver can create, edit, and close trips
- Shopper can browse nearby trip list and trip details
- Shopper can claim item shares
- Oversell prevention (must hold under concurrency)
- Order status transitions
- My Orders / My Trips pages
- Frontend minimum pages:
  - Auth pages: register/login
  - Driver certification page (license info submission)
  - Home trip feed (distance-sorted cards)
  - Trip detail page
  - Shopper "My Orders" page
  - Driver "My Trips" management page

### 4.2 Out of Scope (V1)
- In-app chat
- Rating system
- Real third-party payment charge
- Route optimization
- Audit logging system
- Production monitoring/alerting system

## 5. Roles and Permissions
| Feature | Not Logged In | Shopper | Driver (Verified) | Admin |
|---|---|---|---|---|
| Browse trips | No | Yes | Yes | Yes |
| View trip details | No | Yes | Yes | Yes |
| Claim items | No | Yes | Yes | No |
| Create/Edit/Close trip | No | No | Yes | Yes |
| Review driver applications | No | No | No | Yes |

## 6. Core Flows
### 6.1 Shopper Flow
1. Register with address
2. Browse nearby trips
3. Open trip details and view items/available shares
4. Submit claim
5. Track order status until completion

### 6.2 Driver Flow
1. Register and apply as Driver
2. After approval, create a trip
3. Manage trip and item shares
4. Update claim status and complete handoff

## 7. Functional Requirements (FR)
### FR-1 Authentication
- Support email sign-up/login
- Address required at registration (`street/city/state/zip`)
- New user default role is `shopper`

### FR-2 Address and Nearby Trips (Option A)
- Registration address must be converted to `lat/lng`
- Home page shows only trips within radius
- Response includes distance and is sorted by distance

### FR-3 Driver Verification
- Shopper can submit driver application
- Driver application must include license certification data (at minimum: license number, expiration date, and uploaded proof image URL or file reference)
- Status: `pending/approved/rejected`
- Only `approved` drivers can create trips

### FR-4 Trip Management
- Driver can create/edit/close trips
- Trip fields: `store_name, pickup_location, pickup_time, capacity_total`
- Trip must store pickup coordinates (`pickup_lat`, `pickup_lng`) for distance calculation and map/link display
- Trip status definitions:
  - `open`: visible in feed and claimable
  - `closed`: no new claims allowed; existing claims still visible in history
  - `expired`: pickup time passed; no new claims allowed
- Only trips with status `open` are claimable

### FR-5 Items and Claims
- Driver adds items to trip: `name, unit, total_share`
- Item field definitions:
  - `name`: shopper-facing item label (example: "Chicken Breast")
  - `unit`: how one share is measured/displayed (examples: `lb`, `kg`, `pack`, `box`, `each`)
  - `total_share`: maximum claimable share count for the item on that trip
  - `claimed_share`: already claimed share count (system-maintained)
- Shopper claim quantity must satisfy `qty > 0`
- System maintains `claimed_share`
- `claimed_share > total_share` is never allowed

### FR-6 State Machine
- Claim states: `Claimed -> Purchased -> ReadyForPickup -> Completed`
- No skipping states

### FR-7 My Pages
- Shopper can view own claims
- Driver can view own trips and claim summary

### FR-8 Home and Trip Detail UX Requirements
- Home feed must show trips within configured radius from account address and sort by distance ascending
- Each trip card must show at minimum: driver display name, pickup location text, pickup time, store name, remaining capacity, and distance
- Trip detail must show: pickup location, pickup time, store name, item list (`name/unit`), each item's available shares, and total remaining capacity
- Shopper can claim from trip detail only when trip status is `open`
- Driver home/management view must show their created trips, current status, and claim summary per trip

## 8. Data Model (Simplified)
### User
- id, email, password_hash, role
- address_street/city/state/zip
- lat, lng
- driver_verification_status
- driver_license_number, driver_license_expiration, driver_license_proof_url

### Trip
- id, driver_id
- store_name, pickup_location_text, pickup_lat, pickup_lng, pickup_time
- capacity_total, capacity_left
- status (`open/closed/expired`)

### Item
- id, trip_id
- name, unit
- total_share, claimed_share

### ClaimOrder
- id, trip_id, item_id, shopper_id
- qty
- status (`Claimed/Purchased/ReadyForPickup/Completed`)

## 9. API List (Implementation Reference)
- `POST /auth/register`
- `POST /auth/login`
- `POST /driver/apply`
- `PATCH /admin/driver-applications/{user_id}`
- `GET /trips?radius=5`
- `POST /trips`
- `PATCH /trips/{trip_id}`
- `POST /trips/{trip_id}/claims`
- `PATCH /claims/{claim_id}/status`
- `GET /me/claims`
- `GET /me/trips`

## 9.1 Domain Glossary (To Avoid Ambiguity)
- `share`: the atomic claim quantity unit for an item in one trip
- `unit`: shopper-visible measurement label for a share (such as `lb`, `pack`, `each`)
- `total_share`: total number of shares published by driver for an item
- `claimed_share`: number of shares already reserved by shoppers
- `available_share`: `total_share - claimed_share`
- `capacity_total`: max total carrying capacity for a trip set by driver
- `capacity_left`: remaining trip capacity after accepted claims

## 10. Concurrency and Oversell Prevention (Required)
### 10.1 V1 Database Assumption (MVP1)
- V1 uses **SQLite** as the primary database.
- SQLite does not provide PostgreSQL-style row-level locks (`SELECT ... FOR UPDATE`); write concurrency is controlled primarily by database-level locking.
- In practice, concurrent claim writes are serialized more aggressively in SQLite. This helps correctness in low traffic, but throughput is lower than a row-level-locking database.

### 10.2 Claim Transaction Pattern (SQLite-compatible)
The claim endpoint must run in one database transaction with this logic:
1. Begin write transaction
2. Read target item and compute `available = total_share - claimed_share`
3. Validate `available >= qty`
4. Update `claimed_share = claimed_share + qty`
5. Insert ClaimOrder record
6. Commit transaction

If validation fails, return business conflict error (409).

### 10.3 Limitation and Upgrade Path (MVP2/MVP3)
- For MVP1 and early MVP2, SQLite is acceptable for course-scale traffic and single-instance deployment.
- If AC-4 must hold under higher concurrency (multi-worker or multi-instance deployment), the team should migrate to PostgreSQL in MVP2 or MVP3.
- PostgreSQL target approach:
  - Keep transactional claim flow
  - Use row-level locking or equivalent atomic update strategy
  - Re-run concurrency tests to confirm no oversell under parallel claims

## 11. Acceptance Criteria (AC)
- AC-1: Address is required at registration
- AC-2: Home page only shows `open` trips within radius, sorted by distance
- AC-3: Unverified drivers cannot create trips
- AC-4: No oversell under concurrent claims in the declared deployment profile (SQLite single-instance for MVP2 baseline; PostgreSQL required for higher-concurrency deployment)
- AC-5: Claim state follows defined transitions only
- AC-6: Shopper can only view own orders
- AC-7: `closed/expired` trips are not claimable

## 12. Three-Version Roadmap (Required by course)
The project must deliver 3 versions (MVP1/MVP2/MVP3) with GitHub tags (`mvp-1`, `mvp-2`, `mvp-3`). Development must be distributed across the term, not concentrated in the final week.

### 12.1 Version 1: MVP1 (Foundation)
- Timeline: Week 1-2
- Goal: complete minimum flow `register -> browse nearby trips`
- Scope:
  - Sign up / Login
  - Address geocoding
  - Option A trip feed (radius + distance sort)
  - Read-only trip details
  - Record database decision: SQLite for V1, with documented concurrency limitation and migration trigger
- GitHub Tag: `mvp-1`
- Demo focus:
  - Account creation, login, and nearby trips shown
- Exit criteria:
  - AC-1 and AC-2 pass
  - At least one recordable end-to-end demo segment

### 12.2 Version 2: MVP2 (Transaction)
- Timeline: Week 3-5
- Goal: complete transactional loop `create trip -> claim -> status progress`
- Scope:
  - Driver verification flow
  - Trip CRUD
  - Item management
  - Claim creation
  - Oversell-prevention transaction (SQLite-compatible transactional pattern)
  - Claim state machine
  - My Orders / My Trips
  - Concurrency validation in single-instance SQLite baseline; decide whether PostgreSQL migration is required
- GitHub Tag: `mvp-2`
- Demo focus:
  - Driver publishes trip, shopper claims, status updates
- Exit criteria:
  - AC-3/AC-4/AC-5/AC-6/AC-7 pass
  - Concurrency test passes (no oversell)

### 12.3 Version 3: MVP3 Final (Submission)
- Timeline: Week 6-8
- Goal: stabilize product and complete all course deliverables
- Scope:
  - Bug fixing and stabilization
  - UI/UX polish (without expanding core scope)
  - Final demo and submission materials
  - If needed from MVP2 decision: complete PostgreSQL migration for stronger concurrent-claim guarantees
- GitHub Tag: `mvp-3`
- Demo focus:
  - Full flow + tech stack + deployment + MVP evolution
- Exit criteria:
  - All AC pass
  - Demo video can be recorded end-to-end in one run
  - Individual PDF materials are complete

### 12.4 8-Week Plan (Aligned to 3 Versions)
- Week 1: Requirement freeze, task breakdown, wireframe
- Week 2: Auth + user model + geocoding + release `mvp-1`
- Week 3: Driver verification flow
- Week 4: Trip CRUD + item management
- Week 5: Claim endpoint + oversell prevention + state machine + release `mvp-2`
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
- Confirm key flows are consistent across screens (auth, trip browse, claim, my pages)
- Confirm UX changes do not expand product scope beyond PRD without explicit decision log entry
- Confirm final UI used in demo is the same version merged to main branch
