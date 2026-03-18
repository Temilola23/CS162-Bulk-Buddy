#!/usr/bin/env bash
# Run linters for both frontend and backend

set -e

echo "Running linters..."

# Backend linting
echo "Linting backend..."
python3 -m flake8 backend/
python3 -m black --check --line-length 79 backend/

# Frontend linting
echo "Linting frontend..."
cd frontend
npx eslint src/
cd ..

echo "Linting complete."
