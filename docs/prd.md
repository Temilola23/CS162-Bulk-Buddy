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
- Status: `pending/approved/rejected`
- Only `approved` drivers can create trips

### FR-4 Trip Management
- Driver can create/edit/close trips
- Trip fields: `store_name, pickup_location, pickup_time, capacity_total`
- Only `open` trips are claimable

### FR-5 Items and Claims
- Driver adds items to trip: `name, unit, total_share`
- Shopper claim quantity must satisfy `qty > 0`
- System maintains `claimed_share`
- `claimed_share > total_share` is never allowed

### FR-6 State Machine
- Claim states: `Claimed -> Purchased -> ReadyForPickup -> Completed`
- No skipping states

### FR-7 My Pages
- Shopper can view own claims
- Driver can view own trips and claim summary

## 8. Data Model (Simplified)
### User
- id, email, password_hash, role
- address_street/city/state/zip
- lat, lng
- driver_verification_status

### Trip
- id, driver_id
- store_name, pickup_location_text, pickup_time
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

## 10. Concurrency and Oversell Prevention (Required)
The claim endpoint must use database transactions. Core logic:
1. Lock target item row
2. Read available shares
3. Validate `available >= qty`
4. Update `claimed_share`
5. Insert ClaimOrder record
6. Commit transaction

If validation fails, return business conflict error (409).

## 11. Acceptance Criteria (AC)
- AC-1: Address is required at registration
- AC-2: Home page only shows `open` trips within radius, sorted by distance
- AC-3: Unverified drivers cannot create trips
- AC-4: No oversell under concurrent claims
- AC-5: Claim state follows defined transitions only
- AC-6: Shopper can only view own orders
- AC-7: `closed/expired` trips are not claimable

## 12. Three-Version Roadmap (Required by course)
The project must deliver 3 versions (MVP1/MVP2/MVP3) with GitHub tags. Development must be distributed across the term, not concentrated in the final week.

### 12.1 Version 1: MVP1 (Foundation)
- Timeline: Week 1-3
- Goal: complete minimum flow `register -> browse nearby trips`
- Scope:
  - Sign up / Login
  - Address geocoding
  - Option A trip feed (radius + distance sort)
  - Read-only trip details
- GitHub Tag: `v0.1.0-mvp1`
- Demo focus:
  - Account creation, login, and nearby trips shown
- Exit criteria:
  - AC-1 and AC-2 pass
  - At least one recordable end-to-end demo segment

### 12.2 Version 2: MVP2 (Transaction)
- Timeline: Week 4-7
- Goal: complete transactional loop `create trip -> claim -> status progress`
- Scope:
  - Driver verification flow
  - Trip CRUD
  - Item management
  - Claim creation
  - Oversell-prevention transaction
  - Claim state machine
  - My Orders / My Trips
- GitHub Tag: `v0.2.0-mvp2`
- Demo focus:
  - Driver publishes trip, shopper claims, status updates
- Exit criteria:
  - AC-3/AC-4/AC-5/AC-6/AC-7 pass
  - Concurrency test passes (no oversell)

### 12.3 Version 3: MVP3 Final (Submission)
- Timeline: Week 8-10
- Goal: stabilize product and complete all course deliverables
- Scope:
  - Bug fixing and stabilization
  - UI/UX polish (without expanding core scope)
  - Final demo and submission materials
- GitHub Tag: `v1.0.0-mvp3-final`
- Demo focus:
  - Full flow + tech stack + deployment + MVP evolution
- Exit criteria:
  - All AC pass
  - Demo video can be recorded end-to-end in one run
  - Individual PDF materials are complete

### 12.4 10-Week Plan (Aligned to 3 Versions)
- Week 1: Requirement freeze, task breakdown, wireframe
- Week 2: Auth + user model
- Week 3: Geocoding + trip feed, release `v0.1.0-mvp1`
- Week 4: Driver verification flow
- Week 5: Trip CRUD + item management
- Week 6: Claim endpoint + oversell prevention
- Week 7: State machine + My pages, release `v0.2.0-mvp2`
- Week 8: Frontend-backend integration + bug fixing
- Week 9: Testing + final refinements
- Week 10: Final demo/submission, release `v1.0.0-mvp3-final`

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
- All features merged through PRs; no direct push to `master`
- PR must include clear description, validation/test notes, and review history
- All review comments (human or automated) must be addressed

## 14. Definition of Done (DoD)
- Features implemented according to AC
- At least basic tests or reproducible validation steps provided
- PR description is clear and reviewed
- Code is merged into `master`
