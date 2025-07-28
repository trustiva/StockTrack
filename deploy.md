# Vercel Deployment Guide for FreelanceAuto

## Prerequisites

1. **Neon Database**: Ensure you have a Neon PostgreSQL database set up
2. **Vercel Account**: Create an account at vercel.com
3. **Environment Variables**: Prepare the following environment variables

## Deployment Steps

### 1. Connect Repository to Vercel

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click "New Project"
3. Import your Git repository
4. Vercel will automatically detect this as a Vite project

### 2. Configure Build Settings

Vercel should automatically detect the following settings from `vercel.json`:
- **Framework Preset**: Vite
- **Build Command**: `vite build`
- **Output Directory**: `dist/public`
- **Install Command**: `npm install`

### 3. Set Environment Variables

In your Vercel project settings, add these environment variables:

```
DATABASE_URL=your_neon_database_connection_string
SESSION_SECRET=your_secure_random_session_secret
OPENAI_API_KEY=your_openai_api_key (optional)
REPL_ID=your_replit_repl_id
ISSUER_URL=https://replit.com/oidc
```

### 4. Database Migration

After deployment, you may need to run database migrations:
1. Connect to your deployed Vercel functions
2. Run the database schema push using Drizzle

### 5. Domain Configuration

- Vercel will provide a default `.vercel.app` domain
- You can add custom domains in the project settings

## Project Structure for Vercel

```
├── api/
│   └── index.ts          # Vercel serverless function
├── client/               # Frontend React app
├── server/               # Express server logic
├── shared/               # Shared types and schemas
├── vercel.json          # Vercel configuration
└── package.json         # Dependencies and scripts
```

## Key Configuration Files

- **vercel.json**: Configures build settings and routing
- **api/index.ts**: Serverless function entry point
- **vite.config.ts**: Frontend build configuration

## Troubleshooting

1. **Build Errors**: Check that all dependencies are in `package.json`
2. **Database Connection**: Verify `DATABASE_URL` is correctly set
3. **Authentication**: Ensure `SESSION_SECRET` and auth URLs are configured
4. **API Routes**: All API routes go through `/api/` and are handled by `api/index.ts`

## Post-Deployment

1. Test authentication flow
2. Verify database connectivity
3. Check API endpoints functionality
4. Test frontend routing and static assets