#!/usr/bin/env bash
# Run tests for both frontend and backend.

set -e

echo "Running tests..."

# Backend tests
echo "Testing backend..."
cd backend
python3 -m pytest tests/ -v --cov=app --cov-fail-under=85

# Frontend tests
echo "Testing frontend..."
cd ../frontend
CI=true npm test -- --watchAll=false

echo "All tests complete."
