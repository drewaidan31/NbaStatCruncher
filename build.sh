#!/bin/bash

# Simplified build script for Render deployment
echo "Starting NBA Analytics build process..."

# Install dependencies
npm install

# Build the frontend application
echo "Building frontend..."
npm run build

# Setup database if DATABASE_URL is available
if [ -n "$DATABASE_URL" ]; then
    echo "Setting up database..."
    npm run db:push
    
    echo "Setting up NBA database..."
    tsx server/setup-production-db.js
else
    echo "Warning: DATABASE_URL not found, skipping database setup"
fi

echo "Build completed successfully"