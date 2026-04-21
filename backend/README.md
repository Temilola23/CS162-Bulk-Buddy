# Bulk Buddy -- Backend

The backend API for Bulk Buddy, built with Python (Flask) and SQLAlchemy ORM.

## Setup

1. Copy the environment file:
   ```bash
   cp backend/.env.example backend/.env
   ```
   Edit `backend/.env` and set `SECRET_KEY` and `ADMIN_TOKEN`.

2. Create a virtual environment and activate it:
   ```bash
   cd backend
   python3 -m venv .venv
   source .venv/bin/activate   # macOS/Linux
   .venv\Scripts\activate      # Windows
   ```

3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

The database (`bulkbuddy.db`) is created automatically in `backend/instance/` on first run.

## Structure

```
backend/
├── app/
│   ├── __init__.py            # Flask app factory and blueprint registration
│   ├── extensions.py          # SQLAlchemy instance
│   ├── decorators.py          # @admin_required decorator
│   ├── models/
│   │   ├── enums.py           # UserRole, TripStatus, OrderStatus, ApplicationStatus
│   │   ├── user.py            # User accounts and geocoded location
│   │   ├── trip.py            # Driver trips to stores
│   │   ├── item.py            # Items on a trip (with claimed_quantity denorm)
│   │   ├── order.py           # Shopper orders against trips
│   │   ├── order_item.py      # Line items in an order
│   │   └── driver_application.py  # Driver verification workflow
│   ├── routes/
│   │   ├── auth.py            # POST /api/login, /api/signup, /api/logout
│   │   ├── admin.py           # /admin/* driver application review
│   │   ├── driver.py          # POST /api/driver/apply
│   │   ├── trip.py            # /api/trips* and /api/me/trips*
│   │   └── me.py              # /api/me* profile and orders
│   └── services/
│       ├── auth_service.py
│       ├── admin_service.py
│       ├── driver_service.py
│       ├── trip_service.py
│       ├── order_service.py
│       ├── inventory_service.py
│       └── user_service.py
├── tests/                     # pytest test suite
├── .env.example               # Environment variable template
├── requirements.txt
└── README.md
```

See [docs/ARCHITECTURE.md](../docs/ARCHITECTURE.md) for a full API reference and schema diagram.

## Running Locally

```bash
cd backend
source .venv/bin/activate
flask run --port 5001
```

The API will be available at `http://127.0.0.1:5001`. Port 5001 is used
because macOS AirPlay occupies port 5000.

To run both frontend and backend together, use the dev script from the
project root:

```bash
bash scripts/dev.sh
```

## Testing

```bash
cd backend
python3 -m pytest tests/ -v --tb=short
```
