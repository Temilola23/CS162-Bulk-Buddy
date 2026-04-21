# Bulk Buddy -- The Collaborative Grocery Platform

CS162 Final Project | Minerva University

Bulk Buddy connects cost-conscious San Francisco residents with drivers heading to warehouse stores, enabling coordinated bulk purchases. Shoppers claim item portions from upcoming trips, prepay their share, and pick up their goods -- unlocking bulk savings without needing a car or extra storage space.

## Repository Structure

```
CS162-Bulk-Buddy/
├── .github/
│   ├── PULL_REQUEST_TEMPLATE.md   # PR template (used automatically)
│   └── workflows/                 # CI/CD pipelines
│
├── docs/
│   ├── CONTRIBUTING.md            # Collaboration rules and branching strategy
│   └── ARCHITECTURE.md            # System architecture and design decisions
│
├── frontend/                      # React frontend application
│   ├── tests/                     # Frontend tests
│   └── README.md
│
├── backend/                       # Python (Flask) backend API
│   ├── tests/                     # Backend tests
│   └── README.md
│
├── docker-compose.yml             # Local development environment
│
└── scripts/
    ├── dev.sh                     # Start local dev environment
    ├── lint.sh                    # Run all linters
    └── test.sh                    # Run all tests
```

## Getting Started

1. Clone the repo:
  ```bash
   git clone https://github.com/Temilola23/CS162-Bulk-Buddy.git
   cd CS162-Bulk-Buddy
  ```
2. Create a feature branch:
  ```bash
   git checkout -b feature/your-feature-name
  ```
3. Make your changes, commit, and push:
  ```bash
   git add .
   git commit -m "feat: describe your change"
   git push -u origin feature/your-feature-name
  ```
4. Open a Pull Request on GitHub targeting `main`.

## Workflow Rules

- **Never push directly to `main`** -- always use a feature branch + PR.
- **Every PR must be reviewed** by at least one teammate before merging.
- **Use the PR template** -- it fills in automatically when you create a PR.
- See [docs/CONTRIBUTING.md](docs/CONTRIBUTING.md) for full details.

## Tech Stack

- **Frontend**: React
- **Backend**: Python (Flask)
- **Database**: SQLite
- **Deployment/Dev Containers**: Docker Compose

## Run with Docker (simple local setup)

From the repo root:

1. Copy the backend environment example into a local `.env` file:

```bash
cp backend/.env.example backend/.env
```

2. Start the containers:

```bash
docker compose --env-file backend/.env up -d
```

Apps:

- Frontend: `http://localhost:3000`
- Backend: `http://localhost:5001`

Stop:

```bash
docker compose down
```

## Team

- Bo Shih - PM/Design
- Ekene - Backend/Deployment
- Jonathan - Frontend
- Tara - PM/Design
- Temilola - Backend/DB

## License

MIT
