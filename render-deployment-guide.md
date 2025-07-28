# Render Deployment Guide for FreelanceAuto

## Current Deployment Issue
Your deployment is failing because `DATABASE_URL` environment variable is not set on Render.

## Required Environment Variables for Render

### Essential Variables (Required):
1. **DATABASE_URL** - PostgreSQL database connection string
2. **SESSION_SECRET** - Secure random string (32+ characters)
3. **NODE_ENV** - Set to `production`

### Optional Variables (for full functionality):
4. **OPENAI_API_KEY** - For AI proposal generation
5. **ISSUER_URL** - Set to `https://replit.com/oidc` (if using Replit Auth)
6. **REPL_ID** - Your Replit project ID (if using Replit Auth)

## How to Fix the Deployment Error

### Step 1: Set Environment Variables in Render
1. Go to your Render dashboard
2. Click on your service
3. Go to "Environment" tab
4. Add these environment variables:

```
DATABASE_URL=postgresql://username:password@hostname:port/database_name
SESSION_SECRET=your-very-long-random-session-secret-here
NODE_ENV=production
```

### Step 2: Database Setup Options

#### Option A: Use Render PostgreSQL (Recommended)
1. In Render dashboard, create a new PostgreSQL database
2. Copy the connection string from the database info
3. Use this as your `DATABASE_URL`

#### Option B: Use External Database (Neon, Supabase, etc.)
1. Create a PostgreSQL database on Neon/Supabase
2. Copy the connection string
3. Use this as your `DATABASE_URL`

### Step 3: Session Secret
Generate a secure session secret:
```bash
# Use any of these methods:
openssl rand -base64 32
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

## After Setting Environment Variables
1. Your app should automatically redeploy
2. The database schema will be created automatically on first run
3. Your FreelanceAuto platform will be live!

## Example DATABASE_URL formats:
```
# Render PostgreSQL
postgresql://username:password@hostname:5432/database_name

# Neon
postgresql://username:password@ep-example.us-east-1.aws.neon.tech/neondb

# Supabase
postgresql://postgres:password@db.example.supabase.co:5432/postgres
```

## Need Help?
The build was successful (Frontend: 697KB, Backend: 134KB), so the code is ready. You just need to configure the environment variables in Render.