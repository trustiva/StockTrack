#!/bin/bash

# FreelanceAuto Deployment Script
# This script helps deploy the application to various hosting platforms

set -e

echo "🚀 FreelanceAuto Deployment Script"
echo "=================================="

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Check dependencies
echo "📋 Checking dependencies..."

if ! command_exists node; then
    echo "❌ Node.js is not installed. Please install Node.js 18+ first."
    exit 1
fi

if ! command_exists npm; then
    echo "❌ npm is not installed. Please install npm first."
    exit 1
fi

echo "✅ Dependencies check passed"

# Install packages
echo "📦 Installing dependencies..."
npm install

# Check for environment variables
echo "🔧 Checking environment configuration..."

if [ ! -f ".env" ]; then
    echo "⚠️  No .env file found. Creating from example..."
    if [ -f ".env.example" ]; then
        cp .env.example .env
        echo "📝 Please edit .env file with your actual configuration values"
        echo "⚠️  Required: OPENAI_API_KEY, GEMINI_API_KEY, DATABASE_URL"
    else
        echo "❌ .env.example file not found"
        exit 1
    fi
fi

# Build the application
echo "🏗️  Building application..."
npm run build

# Database setup
echo "🗄️  Setting up database..."
if command_exists npx; then
    echo "Running database migrations..."
    npm run db:push
else
    echo "⚠️  npx not found, skipping database setup"
fi

# Run tests if available
echo "🧪 Running tests..."
if npm run test --silent 2>/dev/null; then
    echo "✅ Tests passed"
else
    echo "⚠️  No tests found or tests failed"
fi

# Performance check
echo "⚡ Running performance checks..."
echo "- Checking bundle size..."
if [ -d "dist" ]; then
    BUNDLE_SIZE=$(du -sh dist | cut -f1)
    echo "  Bundle size: $BUNDLE_SIZE"
else
    echo "  ⚠️  Dist folder not found"
fi

# Security check
echo "🔒 Running security audit..."
npm audit --audit-level moderate || echo "⚠️  Security vulnerabilities found - please review"

# Final deployment steps
echo "🎯 Preparing for deployment..."

# Create logs directory
mkdir -p logs

# Set proper permissions
chmod +x deploy.sh

echo ""
echo "✅ Deployment preparation complete!"
echo ""
echo "🌐 Deployment Options:"
echo "====================="
echo ""
echo "1. 🔵 Replit Deployment:"
echo "   - Already configured for Replit"
echo "   - Make sure to set environment variables in Replit Secrets"
echo "   - Required secrets: OPENAI_API_KEY, GEMINI_API_KEY"
echo ""
echo "2. ⚡ Vercel Deployment:"
echo "   - Install Vercel CLI: npm i -g vercel"
echo "   - Run: vercel"
echo "   - Set environment variables in Vercel dashboard"
echo ""
echo "3. 🚀 Heroku Deployment:"
echo "   - Install Heroku CLI"
echo "   - heroku create your-app-name"
echo "   - git push heroku main"
echo "   - heroku config:set OPENAI_API_KEY=your_key"
echo ""
echo "4. 🐳 Docker Deployment:"
echo "   - docker build -t freelanceauto ."
echo "   - docker run -p 5000:5000 --env-file .env freelanceauto"
echo ""
echo "5. 🌊 DigitalOcean/AWS/GCP:"
echo "   - Upload files to your server"
echo "   - Install Node.js and npm"
echo "   - Set environment variables"
echo "   - Run: npm start"
echo ""
echo "📝 Post-deployment checklist:"
echo "- ✅ Verify all environment variables are set"
echo "- ✅ Test API endpoints (/api/health)"
echo "- ✅ Check email service configuration"
echo "- ✅ Verify database connection"
echo "- ✅ Test AI services (OpenAI & Gemini)"
echo "- ✅ Monitor performance metrics"
echo ""
echo "🔗 Useful endpoints after deployment:"
echo "- Health check: /api/health"
echo "- Performance: /api/performance/analytics"
echo "- Email test: /api/email/test"
echo ""
echo "Happy deploying! 🎉"