# Architecture Overview

## High-Level Architecture

Bulk Buddy follows a client-server architecture with clear separation of concerns.

```
+-------------------+       +-------------------+       +-------------------+
|                   |       |                   |       |                   |
|    Frontend       | <---> |    Backend API    | <---> |    Database       |
|    (React)        |  HTTP |    (Flask)  | ORM |       |    (SQLite)       |
|                   |       |                   |       |                   |
+-------------------+       +-------------------+       +-------------------+
```

## Separation of Concerns

### Frontend (Presentation Layer)
- Handles all user interface rendering and interactions
- Manages client-side state and routing
- Communicates with backend exclusively through REST API calls
- No direct database access

### Backend API (Business Logic Layer)
- Exposes RESTful endpoints for all operations
- Handles authentication and authorization
- Contains all business logic (trip management, item claiming, payment processing)
- Manages database interactions through ORM models

### Database (Data Layer)
- Stores all persistent data (users, trips, items, transactions)
- Accessed only through the backend ORM
- Schema managed through migrations

## Core Modules

1. **Authentication & Profiles** -- User accounts with Shopper/Driver roles
2. **Trip Feed** -- Browsing and posting warehouse trips
3. **Item Claims & Inventory** -- Claiming portions of bulk items
4. **Payment Integration** -- Handling prepayment and transaction records

## Tech Stack

- **Frontend**: React
- **Backend**: Python (Flask)
- **Database**: SQLite
- **Deployment**: TBD

---

*This document gets updated as the architecture evolves. Include diagrams for your final submission.*
