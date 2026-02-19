#!/usr/bin/env bash
# Run tests for both frontend and backend

set -e

echo "Running tests..."

# Backend tests
echo "Testing backend..."
cd backend
# TBD: add backend test command (e.g., pytest, python manage.py test)
cd ..

# Frontend tests
echo "Testing frontend..."
cd frontend
# TBD: add frontend test command (e.g., npm test)
cd ..

echo "All tests complete."
