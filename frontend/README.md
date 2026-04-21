# Bulk Buddy -- Frontend

The React 19 frontend for Bulk Buddy.

## Setup

**Prerequisites:** Node.js 18+

```bash
cd frontend
npm install
```

## Running Locally

Start the backend first (see [backend/README.md](../backend/README.md) or the root [README](../README.md)), then:

```bash
cd frontend
npm start
```

Frontend is available at http://localhost:3000. API requests to `/api/*` and `/admin/*` are proxied to the backend at `http://127.0.0.1:5001` automatically (configured in `package.json`).

## Testing

```bash
cd frontend
npm test -- --watchAll=false
```

## Structure

```
frontend/src/
├── App.js                  # Route definitions and route guards
├── ApiClient.js            # HTTP client (wraps fetch, sends cookies)
├── index.js                # ReactDOM root + context providers
│
├── pages/                  # One directory per page
│   ├── Landing/            # Public landing page
│   ├── Login/              # Shopper login
│   ├── Register/           # Shopper signup
│   ├── TripFeed/           # Browse open driver trips
│   ├── ItemFeed/           # Browse claimable items across all trips
│   ├── Cart/               # Cart grouped by trip, checkout
│   ├── MyOrders/           # Shopper order history
│   ├── TripDetail/         # Detailed trip view from an order
│   ├── Profile/            # User profile + driver application
│   ├── Settings/           # Edit profile fields
│   ├── DriverTrips/        # Driver trip CRUD and status management
│   ├── AdminLogin/         # Admin login
│   ├── AdminRegister/      # Admin account creation (token-gated)
│   ├── AdminApplications/  # List driver applications
│   └── AdminApplicationReview/ # Review a single application
│
├── components/             # Shared UI components
│   ├── ShopperHeader.js    # Nav header with cart badge
│   ├── CartDrawer.js       # Cart sidebar widget
│   ├── AdminShell.js       # Admin console layout
│   └── ErrorBoundary.js    # Error fallback
│
├── contexts/
│   ├── SessionProvider.js  # Current user and session state
│   ├── CartProvider.js     # Cart groups (persisted to sessionStorage)
│   └── ApiProvider.js      # Exposes ApiClient via useApi()
│
├── hooks/                  # Data fetching and form state hooks
│
└── utils/                  # Pure helpers
    ├── tripFeed.js         # Cart grouping and subtotal logic
    ├── orderApiAdapters.js # API response -> frontend model mapping
    ├── currency.js         # Price formatting
    ├── dateFormatting.js   # Date/time display
    └── orderStatus.js      # Status label helpers
```

## Route Guards

- `<ProtectedRoute>` -- redirects unauthenticated users to `/login`
- `<DriverRoute>` -- redirects non-drivers to `/profile`
- `<AdminRoute>` -- redirects non-admins to `/`
