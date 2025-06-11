#!/bin/bash

# Fast Render deployment
echo "NBA Analytics - Render Build"

# Install dependencies
npm install

# Quick frontend build
npm run build

# Database setup only if needed
if [ -n "$DATABASE_URL" ]; then
    npx drizzle-kit push
    tsx server/setup-production-db.js
fi

echo "Ready for deployment"