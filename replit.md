# NBA Analytics Platform

## Overview

This is a comprehensive NBA analytics platform that allows users to create custom statistics using mathematical formulas, analyze player performance, and visualize data through interactive charts and leaderboards. The application combines modern web technologies with extensive NBA data to provide insights into player performance across seasons.

## System Architecture

### Frontend Architecture
- **Framework**: React 18+ with TypeScript
- **Styling**: Tailwind CSS with shadcn/ui component library
- **State Management**: TanStack Query (React Query) for server state management
- **Build Tool**: Vite for fast development and optimized builds
- **Data Visualization**: Recharts for interactive charts and graphs

### Backend Architecture
- **Runtime**: Node.js with Express.js framework
- **Database ORM**: Drizzle ORM for type-safe database operations
- **API Design**: RESTful endpoints with proper error handling
- **Session Management**: Express sessions with configurable secrets

### Database Schema
The application uses PostgreSQL with the following core tables:
- `players` - NBA player data with comprehensive statistics
- `custom_stats` - User-created formula-based statistics
- `users` - User authentication and profile data
- `favorite_players` - User's saved favorite players

## Key Components

### Statistical Formula Engine
- **Formula Parser**: Mathematical expression evaluation using mathjs library
- **Custom Statistics**: Users can create formulas combining standard NBA stats (PTS, AST, REB, etc.)
- **Real-time Calculation**: Dynamic computation of custom metrics across player datasets

### Player Data Management
- **Comprehensive Dataset**: 3,800+ NBA players with historical data (1996-2025)
- **Season Filtering**: Multi-season data analysis and comparison
- **Advanced Search**: Player search with team, position, and performance filters

### Authentication System
- **Development Mode**: Mock authentication for testing and development
- **Production Ready**: Configurable authentication with session management
- **Guest Access**: Full analytics features available without authentication

### Data Visualization
- **Interactive Charts**: Player performance trends and comparisons
- **Leaderboards**: Sortable rankings based on custom or traditional statistics
- **Scatter Plot Analysis**: Multi-dimensional player comparisons

## Data Flow

1. **Data Ingestion**: NBA player statistics are imported and stored in PostgreSQL database
2. **Formula Processing**: User-created formulas are parsed and validated using mathjs
3. **Calculation Engine**: Custom statistics are computed dynamically across player datasets
4. **Caching Layer**: TanStack Query provides client-side caching and synchronization
5. **Visualization**: Processed data is rendered through Recharts components

## External Dependencies

### Core Dependencies
- **@tanstack/react-query**: Server state management and caching
- **drizzle-orm**: Type-safe database operations
- **mathjs**: Mathematical expression parsing and evaluation
- **recharts**: Data visualization and charting
- **lucide-react**: Icon library for UI components

### Database
- **PostgreSQL**: Primary database with support for complex queries
- **Neon**: Cloud PostgreSQL provider for production deployments

### Deployment Dependencies
- **@neondatabase/serverless**: Serverless PostgreSQL connection pooling
- **ws**: WebSocket support for database connections

## Deployment Strategy

The application is optimized for multiple deployment platforms:

### Development Environment
- **Replit Integration**: Native support with `.replit` configuration
- **Hot Reload**: Vite development server with fast refresh
- **Environment Variables**: Local `.env` file configuration

### Production Deployment Options
1. **Railway**: Recommended for full-stack applications with automatic PostgreSQL provisioning
2. **Render**: Docker-based deployment with integrated database services
3. **Vercel**: Frontend-optimized deployment with serverless API routes
4. **Heroku**: Traditional PaaS deployment with PostgreSQL add-ons

### Build Process
- **Client Build**: Vite builds optimized React application
- **Server Preparation**: Express server configured for production
- **Database Migration**: Drizzle handles schema synchronization
- **Asset Optimization**: Static files served efficiently

## Changelog

- June 17, 2025. Initial setup

## User Preferences

Preferred communication style: Simple, everyday language.