# Bulk Buddy -- Backend

The backend API for Bulk Buddy, built with Python (Flask) and SQLAlchemy ORM.

## Setup

1. Create a virtual environment and activate it:
   ```bash
   cd backend
   python -m venv .venv
   source .venv/bin/activate   # macOS/Linux
   .venv\Scripts\activate      # Windows
   ```

2. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

3. Initialize the database:
   ```python
   from app import create_app
   app = create_app()
   # Tables are created automatically on app startup
   ```

## Structure

```
backend/
├── app/
│   ├── __init__.py            # Flask app factory
│   ├── extensions.py          # SQLAlchemy instance
│   └── models/
│       ├── __init__.py        # Exports all models
│       ├── user.py            # User accounts and location
│       ├── trip.py            # Driver trips to stores
│       ├── item.py            # Items on a trip
│       ├── order.py           # Shopper orders against trips
│       ├── order_item.py      # Line items in an order
│       └── driver_application.py  # Driver verification flow
├── tests/                     # Backend tests
├── requirements.txt           # Python dependencies
└── README.md
```

## Database

- **ORM**: SQLAlchemy via Flask-SQLAlchemy
- **Engine**: SQLite (file-based, no server needed)
- **Schema**: 6 tables in third normal form (3NF) -- see [docs/DATABASE.md](../docs/DATABASE.md) for full details

The database file (`bulkbuddy.db`) is created automatically in `backend/instance/`
when the Flask app starts for the first time.

## Running Locally

*TBD -- will be added when API routes are implemented.*

## Testing

```bash
cd backend
pytest
```
