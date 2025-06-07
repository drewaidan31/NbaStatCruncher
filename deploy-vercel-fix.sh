#!/bin/bash

# NBA Analytics - Vercel Deployment Fix Script
# This script fixes the TailwindCSS dependency issue for Vercel deployment

echo "🏀 NBA Analytics - Vercel Deployment Fix"
echo "========================================="

# Step 1: Backup original package.json
echo "📦 Backing up original package.json..."
cp package.json package.json.backup

# Step 2: Use deployment-ready package.json
echo "🔧 Applying Vercel-compatible package.json..."
cp package.vercel.json package.json

# Step 3: Clean install dependencies
echo "📥 Installing dependencies..."
npm install

# Step 4: Build the application
echo "🏗️  Building application..."
npm run build

echo "✅ Deployment preparation complete!"
echo ""
echo "📋 Next steps:"
echo "1. Set environment variables in Vercel:"
echo "   - DATABASE_URL (your PostgreSQL connection string)"
echo "   - SESSION_SECRET (random string for sessions)"
echo "   - NODE_ENV=production"
echo ""
echo "2. Deploy to Vercel:"
echo "   vercel --prod"
echo ""
echo "3. Run database migration after deployment:"
echo "   npm run db:push"
echo ""
echo "🔄 To restore original configuration:"
echo "   cp package.json.backup package.json && npm install"