# NBA Analytics Platform

A comprehensive NBA analytics platform that transforms complex player statistics into engaging, user-friendly visualizations and insights, covering multiple seasons with advanced data processing capabilities.

## Features

- **Player Statistics Analysis**: Comprehensive NBA player data with multi-season tracking
- **Custom Statistics Builder**: Create and save personalized player evaluation formulas
- **Interactive Leaderboards**: Dynamic rankings with filtering and sorting options
- **Player Comparison Tools**: Side-by-side statistical comparisons
- **Favorites System**: Save and track preferred players
- **Historical Data**: Access to player statistics from 1996-2025
- **Real-time Calculations**: Live formula evaluation and ranking updates

## Tech Stack

- **Frontend**: React with TypeScript, Tailwind CSS, shadcn/ui components
- **Backend**: Node.js with Express
- **Database**: PostgreSQL with Drizzle ORM
- **Authentication**: Replit Auth integration
- **Data Source**: NBA API integration
- **Build Tool**: Vite

## Setup Instructions

### Prerequisites

- Node.js 20.x or higher
- PostgreSQL database
- Git

### Installation

1. Clone the repository:
```bash
git clone <your-repo-url>
cd nba-analytics
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env
```

Edit `.env` with your Neon database configuration:
```
DATABASE_URL=postgresql://username:password@ep-xxxxx-xxxxx.us-east-2.aws.neon.tech/neondb?sslmode=require
SESSION_SECRET=your-random-secret-key-here
NODE_ENV=development
PORT=5000
```

4. Set up the database:
```bash
node setup-complete-database.js
```

Or manually:
```bash
npm run db:push
python3 scripts/nba_data.py
```

5. Start the development server:
```bash
npm run dev
```

The application will be available at `http://localhost:5000`

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run db:push` - Push database schema changes
- `npm run db:studio` - Open Drizzle Studio for database management

## Project Structure

```
├── client/                 # Frontend React application
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   ├── pages/          # Application pages
│   │   └── lib/            # Utility functions and configurations
├── server/                 # Backend Express application
│   ├── routes.ts           # API routes
│   ├── storage.ts          # Database operations
│   └── index.ts            # Server entry point
├── shared/                 # Shared types and schemas
│   └── schema.ts           # Database schema definitions
└── scripts/                # Data processing scripts
```

## Database Schema

The application uses PostgreSQL with the following main tables:
- `players` - NBA player information and statistics
- `custom_stats` - User-created statistical formulas
- `favorite_players` - User favorite player relationships
- `users` - User authentication and profile data

## Deployment

For production deployment:

1. Set `NODE_ENV=production` in your environment
2. Configure your production database URL
3. Run `npm run build` to create production assets
4. Start the server with `npm start`

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License.