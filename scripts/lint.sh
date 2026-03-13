#!/usr/bin/env bash
# Run linters for both frontend and backend

set -e

echo "Running linters..."

# Backend linting
echo "Linting backend..."
# TBD: add backend linter (e.g., ruff check ., flake8)
python3 -m black --line-length 79 backend/   

# Frontend linting
echo "Linting frontend..."
cd frontend
# TBD: add frontend linter (e.g., npx eslint src/)
cd ..

echo "Linting complete."
