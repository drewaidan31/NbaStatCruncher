# NBA Analytics Platform

A comprehensive NBA analytics platform that transforms complex player statistics into engaging, user-friendly visualizations and insights.

## Features

- **Player Search & Statistics**: Search and analyze NBA player performance data
- **Custom Stat Calculator**: Build custom formulas using basketball statistics
- **Guided Stat Builder**: AI-powered formula generation based on player archetypes
- **Career Progression Charts**: Visualize player development over multiple seasons
- **Scatter Plot Analysis**: Interactive data visualization and correlation analysis
- **Favorite Players**: Save and track preferred players
- **My Custom Stats**: Save and manage custom statistical formulas

## Tech Stack

- **Frontend**: React 18 with TypeScript, Tailwind CSS, Vite
- **Backend**: Node.js, Express, TypeScript
- **Database**: PostgreSQL with Drizzle ORM
- **UI Components**: Radix UI, Lucide React Icons
- **Data Visualization**: Recharts, Framer Motion
- **Authentication**: Passport.js with session management

## Setup Instructions

### For GitHub/Local Development

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd nba-analytics-platform
   ```

2. **Install dependencies**
   ```bash
   # Remove Replit-specific package.json and use GitHub version
   mv package.json package.replit.json
   mv package.github.json package.json
   
   # Remove Replit-specific vite config and use GitHub version
   mv vite.config.ts vite.config.replit.ts
   mv vite.config.github.ts vite.config.ts
   
   npm install
   ```

3. **Environment Setup**
   Create a `.env` file with the following variables:
   ```env
   DATABASE_URL=your_postgresql_connection_string
   SESSION_SECRET=your_session_secret_key
   NODE_ENV=development
   ```

4. **Database Setup**
   ```bash
   # Push database schema
   npm run db:push
   ```

5. **Run the application**
   ```bash
   # Development mode
   npm run dev
   
   # Production build
   npm run build
   npm start
   ```

### For Replit

The application is pre-configured for Replit with:
- Automatic PostgreSQL database provisioning
- Replit-specific plugins and configurations
- Session management with connect-pg-simple
- Authentication via Replit's OIDC

Simply run:
```bash
npm run dev
```

## Project Structure

```
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/     # React components
│   │   ├── pages/         # Page components
│   │   ├── lib/           # Utilities and configurations
│   │   └── hooks/         # Custom React hooks
├── server/                # Express backend
│   ├── routes.ts          # API routes
│   ├── storage.ts         # Database operations
│   └── index.ts           # Server entry point
├── shared/                # Shared types and schemas
│   └── schema.ts          # Database schema definitions
└── attached_assets/       # Static assets
```

## Key Components

### Custom Stats Calculator
Interactive calculator for building basketball formulas with:
- Player statistics buttons (PTS, AST, REB, etc.)
- Mathematical operations (+, -, ×, ÷)
- Number pad with decimal support
- Delete button for precise editing
- Clear functionality

### Guided Stat Builder
AI-powered formula generation featuring:
- Player archetype selection (shooter, playmaker, defender, etc.)
- Priority weighting system
- Simple/Advanced mode options
- Contextually intelligent basketball formulas

### Data Visualization
- Career progression charts showing player development
- Interactive scatter plots for statistical correlation analysis
- Responsive design with dark/light mode support

## Database Schema

The application uses PostgreSQL with the following main tables:
- `users` - User authentication and profiles
- `players` - NBA player information and statistics
- `custom_stats` - User-created statistical formulas
- `favorite_players` - User's saved favorite players

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License

MIT License