#!/bin/bash

# Build script for Render deployment
echo "Starting NBA Analytics build process..."

# Install dependencies
echo "Installing dependencies..."
npm install

# Build the application
echo "Building application..."
npm run build

# Build the production server
echo "Building production server..."
npx esbuild server/production.ts --platform=node --packages=external --bundle --format=esm --outdir=dist

# Run database migrations if DATABASE_URL is available
if [ -n "$DATABASE_URL" ]; then
    echo "Running database migrations..."
    npm run db:push
    echo "Database migrations completed"
    
    echo "Importing NBA player data..."
    node scripts/import-nba-data.js
    echo "NBA data import completed"
else
    echo "Warning: DATABASE_URL not found, skipping database operations"
fi

echo "Build process completed successfully"