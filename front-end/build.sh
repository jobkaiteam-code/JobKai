#!/bin/bash

# Quick build script for JobKai frontend container
set -e

cd "$(dirname "$0")"

echo "🔨 Building JobKai Frontend Container..."

# Check if .env exists
if [ ! -f .env ]; then
    echo "⚠️  Warning: .env file not found. Using defaults."
    echo "   Create .env with your Firebase configuration for full functionality."
fi

# Build the container
docker compose build frontend

echo "✅ Frontend container built successfully!"
echo ""
echo "To run the container:"
echo "  docker compose up -d frontend"
echo ""
echo "To run entire stack:"
echo "  cd .. && docker compose up -d --build"
