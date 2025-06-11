#!/bin/bash

# Render deployment build script
echo "Building NBA Analytics for production..."

# Install dependencies
npm install

# Build frontend only (skip complex server bundling)
echo "Building frontend..."
npx vite build

# Database setup
if [ -n "$DATABASE_URL" ]; then
    echo "Setting up database..."
    npx drizzle-kit push
    
    echo "Importing NBA data..."
    tsx server/setup-production-db.js
else
    echo "Warning: No DATABASE_URL - skipping database setup"
fi

echo "Build complete"