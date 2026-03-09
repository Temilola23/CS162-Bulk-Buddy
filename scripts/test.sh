#!/usr/bin/env bash
set -e

echo "Running tests..."

# Backend tests
echo "Testing backend..."
cd backend
python3 -m pytest tests/ -v --tb=short
cd ..

# Frontend tests
echo "Testing frontend..."
cd frontend
# TBD: add frontend test command (e.g., npm test)
cd ..

echo "All tests complete."
