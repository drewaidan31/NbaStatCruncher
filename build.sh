#!/bin/bash

echo "NBA Analytics Build"

npm install

# Frontend build only - avoid complex server bundling
npx vite build

# Database setup
if [ -n "$DATABASE_URL" ]; then
    npx drizzle-kit push
    tsx server/setup-production-db.js
fi

echo "Build complete"