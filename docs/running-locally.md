# Running Bulk Buddy Locally

## Prerequisites

- Python 3.12+
- Node.js 18+
- Docker + Docker Compose (Docker deployment only)

---

## Local (without Docker)

### 1. Environment setup (one-time)

```bash
cp backend/.env.example backend/.env
```

Edit `backend/.env` and set values for `SECRET_KEY` and `ADMIN_TOKEN`.

### 2. Start both servers

```bash
bash scripts/dev.sh
```

- Frontend: `http://localhost:3000`
- Backend: `http://127.0.0.1:5001`

Press `Ctrl-C` to stop both.

### Manual setup (if you prefer separate terminals)

First-time only -- create the virtual environment:

```bash
cd backend
python3 -m venv .venv
pip install -r requirements.txt
```

Terminal 1 -- backend:

```bash
cd backend
source .venv/bin/activate    # Windows: .venv\Scripts\activate
flask run --port 5001
```

Terminal 2 -- frontend:

```bash
cd frontend
npm install
npm start
```

API requests proxy to `http://127.0.0.1:5001` automatically (configured in `package.json`).

### 4. Tests (backend)

```bash
cd backend
source venv/bin/activate
python3 -m pytest tests/ -v --tb=short --cov=app --cov-report=term-missing
```

---

## Docker

### 1. Environment setup (one-time)

```bash
cp backend/.env.example .env
```

Edit `.env` at the repo root and set `ADMIN_TOKEN` and `SECRET_KEY`. Docker Compose reads this file automatically.

### 2. Build and run

```bash
docker compose up --build
```

- Backend: `http://localhost:5001`
- Frontend: `http://localhost:3000`

### 3. Run in the background

```bash
docker compose up --build -d
```

### 4. Stop

```bash
docker compose down
```

To also remove the persistent database volume:

```bash
docker compose down -v
```
