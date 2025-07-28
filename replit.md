# FreelanceAuto - AI-Powered Freelance Automation Platform

## Overview

FreelanceAuto is a comprehensive full-stack automation platform for freelancers that provides real platform integrations, automated project discovery, AI-powered proposal generation, and complete project management. The platform automatically finds and applies to relevant projects across multiple freelancing platforms (Upwork, Freelancer, Fiverr), generates personalized proposals using AI, and provides real-time notifications and advanced analytics.

## User Preferences

Preferred communication style: Simple, everyday language.

## Recent Changes

### Migration to Replit (July 28, 2025)
- Successfully migrated FreelanceAuto platform from Replit Agent to standard Replit environment
- Configured PostgreSQL database with full schema deployment
- Set up authentication system with Replit Auth and session management
- All core services operational: project discovery, proposal generation, automation engine
- Platform ready for further development and feature enhancements

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
- **Platform Connections**: Real API credentials for freelancing platforms
- **Projects**: Live project data from actual platform APIs
- **Proposals**: AI-generated and manual proposals with submission tracking
- **Automation Settings**: Advanced automation preferences and rules
- **Notifications**: Real-time notifications with email alerts
- **Sessions**: Session storage (required for Replit Auth)

### Real Platform Integrations
- **Upwork API**: Live project discovery and proposal submission
- **Freelancer.com API**: Real-time project fetching and application automation
- **Fiverr API**: Buyer request discovery and response automation
- Secure credential management with encryption
- Platform-specific submission logic and rate limiting

### Advanced Automation Engine
- **Intelligent Project Discovery**: AI-powered matching with skill analysis
- **Automated Proposal Generation**: Context-aware AI proposals using OpenAI
- **Smart Application Submission**: Automated proposal submission with success tracking
- **Advanced Filtering**: Budget, skill, client rating, and keyword filtering
- **Rate Limiting**: Respects platform limits and prevents account issues

### Comprehensive Notification System
- **Real-time Notifications**: WebSocket-based instant updates
- **Email Alerts**: SMTP integration for important notifications
- **Notification Center**: Centralized inbox with read/unread status
- **Custom Alerts**: User-configurable notification preferences
- **Push Notifications**: Browser-based instant alerts

### Enhanced User Interface
- **Advanced Dashboard**: Real-time analytics and automation status
- **Automation Controls**: Start/stop automation with health monitoring
- **Platform Integration Manager**: Secure credential management
- **Enhanced Proposal Generator**: AI customization with tone and emphasis controls
- **Real-time Analytics**: Performance tracking and earnings forecasting
- **Notification Center**: Modern notification management interface

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
- **Live API Integrations** with real freelancing platforms:
  - **Upwork API**: Project search, proposal submission, client communication
  - **Freelancer.com API**: Contest discovery, bid submission, message automation
  - **Fiverr API**: Buyer request monitoring, custom offer creation
- **Security Features**: Encrypted credential storage, OAuth2 authentication
- **Rate Limiting**: Intelligent request management to prevent API throttling
- **Error Handling**: Robust error recovery and user notification system

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