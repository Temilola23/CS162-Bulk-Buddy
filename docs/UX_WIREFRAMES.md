# Bulk Buddy – Core UX & Wireframes (Boss)

CS162 Final Project - First Check in - PM/Design Deliverable  
Author: **Boss**  

This document captures low-fidelity UX flows and text-based wireframes for the Bulk Buddy MVP. It is intended to guide frontend implementation and keep the product aligned with the original project design and research.

---

## 1. Primary User Flows

### 1.1 Shopper: Join a bulk trip and claim items

1. Land on marketing/landing page → understand value prop.
2. Sign up as a new user with **address required** (street/city/state/zip) → system geocodes to lat/lng, default role is Shopper.
3. View Trip Feed → **automatically shows nearby trips within radius (default: 5 miles), sorted by distance** → see distance to each trip.
4. Open Trip Detail → see driver info, pickup time/location, and available items.
5. Select items and claim portions from the **driver’s predefined trip item list only** (V1: shoppers cannot request items outside this list) → see running subtotal and remaining capacity.
6. Submit claim → status starts as "Claimed".
7. Track order status progression: **Claimed → Purchased → ReadyForPickup → Completed**.
8. View "My Orders" → see all claimed items with current status and pickup details.

### 1.2 Driver: Apply and post a warehouse trip

1. Sign up as Shopper (default role) with address.
2. Navigate to Profile/Settings → click "Apply to become a Driver".
3. Submit driver application (per FR-3: license number, expiration date, proof image as applicable) → status is "pending".
4. Wait for **admin** (designated system role per PRD, not a regular driver) to review; status changes to "approved" or "rejected". See Section 4 for admin/verification details.
5. Once approved, click "Post Trip" from navbar or dashboard.
6. Fill trip form: store (e.g., Costco), date/time, pickup location text, capacity_total.
7. Add planned bulk items: name, unit, total_share.
8. Publish trip → status is "open", appears in Trip Feed for nearby shoppers.
9. Monitor claims from "My Trips" → see who claimed what, capacity_left updates.
10. Update claim statuses as trip progresses: Purchased → ReadyForPickup → Completed.
11. Close trip when full or expired → status changes to "closed".

---

## 2. Screen Inventory

- **Landing / Home**
- **Sign Up / Log In** (with address fields)
- **Trip Feed (Browse Nearby Trips)** - radius-based, distance-sorted
- **Trip Detail (Claim Items)**
- **Post Trip (Driver Form)** - only for verified drivers
- **My Orders (Shopper view)** - shows claimed items with status progression
- **My Trips (Driver view)** - shows driver's trips and claim management
- **Profile & Settings** - driver application, address management
- **Driver Application Form** - for shoppers applying to become drivers

The MVP should prioritize: Trip Feed (with nearby/distance), Trip Detail, Post Trip, My Orders/My Trips, and Auth screens with address.

---

## 3. Text-Based Wireframes

These are low-fidelity, ASCII-style wireframes to give layout guidance. Frontend is free to adapt for responsiveness and visual polish.

### 3.1 Landing / Home

```
--------------------------------------------------------
 Bulk Buddy                      [Log in]  [Sign up]
--------------------------------------------------------

  [ Hero: "Split bulk groceries. Save more together." ]
  [ Subtitle: "Connect with drivers going to warehouse
               stores and claim only what you need."   ]

  [ CTA: Get Started ]    [ How it works ]

  How it works
  ------------
  (1) Drivers post trips to Costco / Sam's Club
  (2) Shoppers claim portions of bulk items
  (3) Meet at pickup location and pay your share

  [ Simple illustration or icons row ]

  Footer: links to About, Contact, Privacy (optional)
--------------------------------------------------------
```

### 3.2 Auth – Sign Up

```
---------------- Bulk Buddy ----------------

         Create your account

  [ Email                      ]
  [ Password                   ]
  [ Confirm password           ]

  Address (required for nearby trips)
  [ Street address             ]
  [ City                       ]
  [ State        ] [ ZIP code  ]

  (Helper text: Your address helps us show trips near you.
   Default role: Shopper. Apply to become a Driver later.)

  [ Sign up ]

  Already have an account? [Log in]
----------------------------------------------
```

### 3.3 Trip Feed (Nearby Trips)

**Layout (FR-2, AC-2):** Use a **card-based layout**. Each card = one trip. Cards show: store name, pickup time, pickup location, driver name, capacity left, trip status, and **distance from the user**. Sorted by distance (nearest first). Clicking the card or a "View details" button navigates to Trip Detail. This keeps the feed scannable and supports nearby-first logic.

```
---------------- Bulk Buddy ----------------
 [Logo]  [Trip feed] [My orders] [Post trip] [Profile]
----------------------------------------------

  Showing trips within 5 miles (sorted by distance)

  [ Adjust radius: [5] miles ▼ ] [ Only open trips ▢ ]

  -------------------------------------------------
  Trip card 1 (0.8 miles away)
  -------------------------------------------------
  Costco | Sat, Mar 14, 3:00–5:00 PM
  Pickup: Mission District, 16th St BART
  Driver: Alex      Capacity left: 3 slots
  Status: Open

  Items (examples):
    - Kirkland Rice 25lb – 5 portions left
    - Chicken Breasts – 3 portions left

  [ View details ]

  -------------------------------------------------
  Trip card 2 (1.2 miles away)
  ...
```

### 3.4 Trip Detail / Claim Items

```
 Costco – Sat, Mar 14
 Pickup: Mission District, 16th St BART, 6:30 PM
 Driver: Alex   |   Capacity left: 3 slots   |   0.8 miles away
 Status: Open

 Trip notes:
   "Text me if you're running late. I'll wait 10 minutes."

 Items you can claim
 -----------------------------------------------
 [ ] Kirkland Rice 25lb
     Unit: bag
     Total shares: 4   |   Claimed: 1   |   Available: 3
     Quantity: [ - ] [ 0 ] [ + ]   (Max 3 available)
     Approx price per share: $6.00

 [ ] Chicken Breasts
     Unit: lb
     Total shares: 5   |   Claimed: 3   |   Available: 2
     Quantity: [ - ] [ 0 ] [ + ]   (Max 2 available)
     Approx price per share: $4.50

 -----------------------------------------------
 Summary
   Total quantity: 0
   Subtotal: $0.00

 [ Submit claim ]
   (Note: Claim status will be "Claimed" initially)
   Subtotal: $0.00
   Service / rounding notes (if any)

 [ Confirm claims ]
----------------------------------------------
```

### 3.5 Post Trip (Driver Form) - Verified Drivers Only

```
---------------- Bulk Buddy ----------------
 [Logo] [Trip feed] [My trips] [Post trip] [Profile]
----------------------------------------------

  Post a new warehouse trip
  (Only verified drivers can create trips)

  Store:     [ Costco        ▼ ]
  Date:      [ 2026-03-14    ]
  Time:      [ 15:00 - 17:00 ]
  Pickup location (text/landmark):
             [ Mission District, 16th St BART Plaza  ]

  Capacity total (max shopper slots): [ 4 ]
  Notes to shoppers:
             [ e.g. "Bring your own bags."    ]

  Items you plan to buy
  -----------------------------------------------
  Item 1
   Name:           [ Kirkland Rice 25lb      ]
   Unit:           [ bag                     ]
   Total share:    [ 4                       ]
   Notes:          [ optional                 ]

  [ + Add another item ]

  [ Publish trip ]
  (Trip status will be "open" and visible to nearby shoppers)
----------------------------------------------
```

### 3.6 My Orders (Shopper view)

```
---------------- Bulk Buddy ----------------
 [Logo] [Trip feed] [My orders] [Post trip] [Profile]
----------------------------------------------

  My Orders (claimed items)

  Tabs: [ Upcoming ] [ Past ]

  Upcoming
  -----------------------------------------------
  Trip: Costco – Sat, Mar 14 – Mission District
  Driver: Alex
  
  Your claims:
    - Kirkland Rice 25lb – 1 share
      Status: [Claimed → Purchased → ReadyForPickup → Completed]
      Current: Claimed
      
    - Chicken Breasts – 2 shares
      Status: [Claimed → Purchased → ReadyForPickup → Completed]
      Current: Claimed
  
  Pickup: 6:30 PM @ 16th St BART Plaza
  Distance: 0.8 miles

  [ View trip details ]
```

### 3.7 My Trips (Driver view)

```
---------------- Bulk Buddy ----------------
 [Logo] [Trip feed] [My trips] [Post trip] [Profile]
----------------------------------------------

  My Trips (trips I'm driving)

  Tabs: [ Open ] [ Closed ] [ Past ]

  Open
  -----------------------------------------------
  Trip: Costco – Sat, Mar 14
  Status: Open
  Capacity: 3/4 slots filled
  Pickup: Mission District, 16th St BART, 6:30 PM
  
  Claims summary:
    - Kirkland Rice 25lb: 1/4 shares claimed
    - Chicken Breasts: 3/5 shares claimed
  
  [ Manage trip ] [ View all claims ] [ Close trip ]
```

### 3.8 Driver Application (Profile/Settings)

**Admin & verification (FR-3):** The **admin** is a designated system role (per PRD roles table), not a regular driver. Approval criteria: license number, expiration date, and proof image as defined in FR-3. **Status meanings:** *Pending* = application submitted, awaiting admin review; *Approved* = user can create and manage trips; *Rejected* = user remains Shopper only. Only approved drivers get "Post Trip" and trip-management permissions.

```
---------------- Bulk Buddy ----------------
 [Logo] [Trip feed] [My orders] [Profile]
----------------------------------------------

  Profile & Settings

  Role: Shopper
  
  Driver Application
  -----------------------------------------------
  Status: [ Pending | Approved | Rejected ]
  
  (If not applied yet:)
  [ Apply to become a Driver ]
  (Application: license, expiration, proof per FR-3)
  
  (If pending:)
  Your application is under review. An admin will review
  your submission (license/expiration/proof) and notify you.
  
  (If approved:)
  ✓ You're a verified driver! You can now create trips.
  [ Post your first trip ]
  
  (If rejected:)
  Your driver application was not approved at this time.
  [ Contact support ] [ Reapply ]
```

---

## 4. UX Notes & Constraints

- **MVP first, polish later**: Focus on making Trip Feed → Trip Detail → Claim → My Orders flow functional before adding secondary features (ratings, in-app chat, notifications).
- **Address required at registration**: Address (street/city/state/zip) is mandatory for geocoding and showing nearby trips. Make this clear in the sign-up form.
- **Nearby trips by default**: Trip Feed automatically shows trips within radius (default 5 miles), sorted by distance. This is core to the product (Option A from PRD).
- **Driver verification required**: Users cannot create trips until they apply and are approved as drivers. Show clear messaging about application status.
- **Claim state progression**: Always show current claim status and the progression path (Claimed → Purchased → ReadyForPickup → Completed). Use visual indicators (progress bar, status badges).
- **My Orders vs My Trips**: Shoppers see "My Orders" (their claimed items), Drivers see "My Trips" (trips they're managing). Keep these distinct in navigation.
- **Claimable items in V1**: Shoppers can only claim from the **driver’s predefined item list** for that trip (FR-5). No requesting additional items outside that list in V1.
- **Oversell prevention**: UI should reflect real-time capacity_left and prevent claiming more than available. Show clear error messages if claim fails due to concurrency.
- **Clarity for car-less shoppers**: Always surface pickup location, time window, distance, and what they owe as early as possible in the flow.
- **Accessibility basics**: Use clear labels, sufficient contrast, and avoid relying solely on color to indicate state (e.g., disabled / full trips, claim status).

---

## 5. Alignment with PRD

This wireframe document aligns with the Bulk Buddy PRD (Product Requirements Document). Key alignments:

- **Address requirement**: Sign-up includes address fields (FR-1, FR-2)
- **Nearby trips**: Trip Feed implements Option A (radius-based, distance-sorted) (FR-2)
- **Driver verification**: Application flow matches FR-3 (pending/approved/rejected)
- **Claim states**: State machine progression matches FR-6 (Claimed → Purchased → ReadyForPickup → Completed)
- **My Orders vs My Trips**: Distinction matches FR-7 (separate views for shoppers and drivers)
- **Trip status**: Only "open" trips are claimable (FR-4, AC-7)

## 6. Next Steps

- Turn these text wireframes into a visual design (e.g., Figma or Excalidraw) and refine spacing, color, and typography.
- Collaborate with frontend team to map each screen to React routes and components.
- Add future extensions (ratings, messaging, payment UX) after the MVP is stable.

