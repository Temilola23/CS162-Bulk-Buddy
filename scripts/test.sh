#!/usr/bin/env bash
# Run tests for both frontend and backend

set -e

echo "Running tests..."

# Backend tests
echo "Testing backend..."
cd backend
python3 -m pytest tests/ -v

# Frontend tests
echo "Testing frontend..."
cd ../frontend
# TBD: add frontend test command (e.g., npm test)

echo "All tests complete."
