#!/usr/bin/env bash
# Start both frontend and backend for local development

set -e

echo "Starting Bulk Buddy development environment..."

# Start backend
echo "Starting backend..."
cd backend
# TBD: add backend start command (e.g., flask run, python manage.py runserver)
cd ..

# Start frontend
echo "Starting frontend..."
cd frontend
# TBD: add frontend start command (e.g., npm start, npm run dev)
cd ..
