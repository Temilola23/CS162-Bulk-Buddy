#!/usr/bin/env bash
# Start both frontend and backend for local development

set -e

echo "Starting Bulk Buddy development environment..."

# Start backend on port 5001 (port 5000 conflicts with macOS AirPlay)
echo "Starting backend on http://127.0.0.1:5001 ..."
cd backend
source .venv/bin/activate
flask run --port 5001 &
BACKEND_PID=$!
cd ..

# Start frontend (CRA proxy forwards /api requests to backend)
echo "Starting frontend on http://localhost:3000 ..."
cd frontend
npm start &
FRONTEND_PID=$!
cd ..

# Trap Ctrl-C to kill both processes
trap "kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; exit" INT TERM

echo ""
echo "Frontend: http://localhost:3000"
echo "Backend:  http://127.0.0.1:5001"
echo "Press Ctrl-C to stop both servers."
echo ""

wait
