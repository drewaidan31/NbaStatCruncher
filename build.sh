#!/bin/bash

# Build script for Render deployment
echo "Starting NBA Analytics build process..."

# Install dependencies
echo "Installing dependencies..."
npm install

# Build the application
echo "Building application..."
npm run build

# Run database migrations if DATABASE_URL is available
if [ -n "$DATABASE_URL" ]; then
    echo "Running database migrations..."
    npm run db:push
    echo "Database migrations completed"
else
    echo "Warning: DATABASE_URL not found, skipping database migrations"
fi

echo "Build process completed successfully"