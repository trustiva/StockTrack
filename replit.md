# FreelanceAuto - AI-Powered Freelance Automation Platform

## Overview

FreelanceAuto is a full-stack web application designed to automate freelance proposal generation and project discovery. The platform helps freelancers streamline their workflow by automatically finding relevant projects across multiple freelancing platforms and generating personalized proposals using AI.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter for client-side routing
- **State Management**: TanStack Query (React Query) for server state management
- **UI Framework**: shadcn/ui components built on Radix UI primitives
- **Styling**: Tailwind CSS with CSS variables for theming
- **Build Tool**: Vite for fast development and optimized production builds

### Backend Architecture
- **Runtime**: Node.js with Express.js server
- **Language**: TypeScript with ES modules
- **Database**: PostgreSQL with Drizzle ORM
- **Database Provider**: Neon Database (serverless PostgreSQL)
- **Authentication**: Replit Auth with OpenID Connect
- **Session Management**: express-session with PostgreSQL store

### Development Environment
- **Platform**: Optimized for Replit deployment
- **Hot Reload**: Vite dev server with HMR
- **Error Handling**: Runtime error overlay for development

## Key Components

### Authentication System
- Replit Auth integration with OpenID Connect
- Session-based authentication with PostgreSQL session store
- User profile management with automatic user creation
- Protected routes with authentication middleware

### Database Schema
- **Users**: Core user information (required for Replit Auth)
- **Freelancer Profiles**: Extended profile data (bio, skills, rates, experience)
- **Platform Connections**: Integration with freelancing platforms
- **Projects**: Scraped/fetched project data from various platforms
- **Proposals**: Generated and manual proposals with tracking
- **Automation Settings**: User preferences for automation behavior
- **Notifications**: System notifications and alerts
- **Sessions**: Session storage (required for Replit Auth)

### AI Integration
- OpenAI API for proposal generation
- Natural Language Processing for project matching
- Customizable proposal templates and instructions
- Match scoring algorithm for project relevance

### Project Discovery
- Mock project search system (MVP implementation)
- Support for multiple freelancing platforms (Upwork, Freelancer, Guru, etc.)
- Skill-based filtering and matching
- Automated project discovery with configurable intervals

### User Interface
- Dashboard with statistics and recent activity
- Project browser with filtering and search
- Proposal generator with AI assistance
- Profile management for freelancer information
- Settings panel for automation configuration
- Analytics page for performance tracking

## Data Flow

### Authentication Flow
1. User authenticates via Replit Auth (OAuth2/OIDC)
2. Session created and stored in PostgreSQL
3. User profile created/updated in database
4. Protected routes validate session for each request

### Project Discovery Flow
1. Automated search runs based on user settings
2. Projects fetched from multiple platforms (currently mocked)
3. AI matching algorithm scores projects against user profile
4. High-scoring projects stored and user notified

### Proposal Generation Flow
1. User selects project from discovered list
2. AI analyzes project requirements and user profile
3. Custom proposal generated using OpenAI API
4. User can review, edit, and submit proposal
5. Proposal tracking and status updates

### Data Persistence
1. All user data stored in PostgreSQL via Drizzle ORM
2. Session data managed by connect-pg-simple
3. File uploads and assets handled via Vite static serving
4. Real-time updates via React Query cache invalidation

## External Dependencies

### Core Dependencies
- **@neondatabase/serverless**: Serverless PostgreSQL client
- **drizzle-orm**: Type-safe ORM for database operations
- **@tanstack/react-query**: Server state management
- **@radix-ui/***: Headless UI components for accessibility
- **openai**: AI integration for proposal generation
- **passport**: Authentication middleware (with openid-client strategy)

### Development Dependencies
- **tsx**: TypeScript execution for development
- **esbuild**: Fast bundling for production builds
- **vite**: Frontend build tool and dev server
- **tailwindcss**: Utility-first CSS framework

### Platform Integrations
- Currently implements mock data for MVP
- Designed to integrate with APIs from:
  - Upwork API
  - Freelancer API
  - Guru API
  - Fiverr API
  - PeoplePerHour API

## Deployment Strategy

### Development Environment
- **Command**: `npm run dev` starts both frontend and backend
- **Hot Reload**: Vite HMR for frontend, tsx watch mode for backend
- **Database**: Drizzle migrations with `npm run db:push`

### Production Build
- **Frontend**: Vite builds optimized React bundle to `dist/public`
- **Backend**: esbuild bundles Node.js server to `dist/index.js`
- **Assets**: Static files served from `dist/public`

### Environment Variables
- `DATABASE_URL`: PostgreSQL connection string (required)
- `SESSION_SECRET`: Session encryption key (required)
- `OPENAI_API_KEY`: OpenAI API access (optional for MVP)
- `REPL_ID`: Replit deployment identifier
- `ISSUER_URL`: OAuth issuer URL for authentication

### Database Setup
- Drizzle Kit manages schema migrations
- PostgreSQL tables auto-created on first run
- Session table required for Replit Auth compliance
- Foreign key constraints ensure data integrity

### Security Considerations
- HTTPS enforced in production
- Session cookies are httpOnly and secure
- SQL injection prevention via parameterized queries
- CORS configured for Replit domains
- Authentication required for all API endpoints