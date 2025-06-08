# GitHub Codespaces Setup Guide

## Quick Fix for Port Conflict

If you see "Error: listen EADDRINUSE: address already in use 0.0.0.0:5000":

### Option 1: Kill the conflicting process
```bash
# Find and kill process using port 5000
sudo lsof -ti:5000 | xargs kill -9

# Then start the app
npm run dev
```

### Option 2: Use a different port
```bash
# Set custom port in your terminal
export PORT=3000
npm run dev
```

### Option 3: Update your .env file
```bash
# Create/edit .env file
echo "PORT=3000" >> .env
echo "DATABASE_URL=your_neon_database_url_here" >> .env
npm run dev
```

## Complete Setup Steps

1. **Clone and setup:**
```bash
npm install
cp .env.example .env
```

2. **Configure environment:**
Edit `.env` and add your Neon database URL:
```
DATABASE_URL=postgresql://neondb_owner:npg_lasou4KL5Sci@ep-silent-waterfall-a5vavjeg.us-east-2.aws.neon.tech/neondb?sslmode=require
NODE_ENV=development
PORT=3000
```

3. **Start application:**
```bash
npm run dev
```

The app will be available at the forwarded Codespaces URL on your chosen port.