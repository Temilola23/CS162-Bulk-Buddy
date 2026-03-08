#!/usr/bin/env bash
# Run tests for both frontend and backend

set -e

echo "Running tests..."

# Backend tests
echo "Testing backend..."
python -m pytest backend/tests -v

# Frontend tests
echo "Testing frontend..."
# TBD: add frontend test command (e.g., npm test)

echo "All tests complete."
