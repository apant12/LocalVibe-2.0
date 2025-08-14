# 🚀 LocalVibe Deployment Guide

## Quick Deploy Options

### Option 1: Vercel (Recommended - Easiest)

1. **Install Vercel CLI:**
   ```bash
   npm install -g vercel
   ```

2. **Login to Vercel:**
   ```bash
   vercel login
   ```

3. **Deploy:**
   ```bash
   vercel
   ```

4. **Set Environment Variables in Vercel Dashboard:**
   - Go to your project settings
   - Add all environment variables from your `.env` file
   - Make sure to use production API keys

### Option 2: Railway

1. **Install Railway CLI:**
   ```bash
   npm install -g @railway/cli
   ```

2. **Login and Deploy:**
   ```bash
   railway login
   railway init
   railway up
   ```

3. **Set Environment Variables:**
   ```bash
   railway variables set DATABASE_URL="your-production-db-url"
   railway variables set SESSION_SECRET="your-secret"
   # ... add all other variables
   ```

### Option 3: Render

1. **Connect your GitHub repository**
2. **Create a new Web Service**
3. **Configure build settings:**
   - Build Command: `npm run build`
   - Start Command: `npm start`
4. **Set environment variables in the dashboard**

## Pre-Deployment Checklist

### 1. Set up Production Database

**Neon (Recommended):**
- Go to [neon.tech](https://neon.tech)
- Create free account
- Create new project
- Copy connection string

**Supabase:**
- Go to [supabase.com](https://supabase.com)
- Create free account
- Create new project
- Get connection string from Settings > Database

### 2. Environment Variables

Create these environment variables in your deployment platform:

```bash
NODE_ENV=production
PORT=3000
DATABASE_URL="your-production-database-url"
SESSION_SECRET="generate-a-strong-secret"
STRIPE_SECRET_KEY="your-stripe-live-key"
VITE_STRIPE_PUBLIC_KEY="your-stripe-live-public-key"
EVENTBRITE_TOKEN="your-eventbrite-token"
GOOGLE_PLACES_KEY="your-google-places-key"
MAPBOX_TOKEN="your-mapbox-token"
MUX_TOKEN_SECRET="your-mux-secret"
MUX_TOKEN_ID="your-mux-id"
TICKETMASTER_KEY="your-ticketmaster-key"
GOOGLE_CLIENT_ID="your-google-oauth-client-id"
GOOGLE_CLIENT_SECRET="your-google-oauth-secret"
APPLE_CLIENT_ID="your-apple-client-id"
APPLE_TEAM_ID="your-apple-team-id"
APPLE_KEY_ID="your-apple-key-id"
APPLE_PRIVATE_KEY="your-apple-private-key"
ISSUER_URL="https://your-domain.com"
```

### 3. Database Migration

After setting up your production database:

```bash
# Push schema to production database
npm run db:push

# Seed initial data (if needed)
npm run seed
```

### 4. OAuth Configuration

**For Google OAuth:**
1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create a new project or select existing
3. Enable Google+ API
4. Create OAuth 2.0 credentials
5. Add your production domain to authorized origins
6. Add your production callback URL: `https://your-domain.com/api/auth/google/callback`

**For Apple OAuth:**
1. Go to [Apple Developer Console](https://developer.apple.com)
2. Create App ID
3. Enable Sign In with Apple
4. Create Service ID
5. Configure domains and redirect URLs

### 5. API Keys Setup

**Stripe:**
- Switch to live mode in Stripe dashboard
- Use live keys instead of test keys

**Other APIs:**
- Eventbrite: Get production token
- Google Places: Enable billing and get API key
- Mapbox: Get production token
- Ticketmaster: Get production API key

## Post-Deployment

### 1. Test Your App
- Test login functionality
- Test all API integrations
- Test payment flow (if using Stripe)
- Test OAuth flows

### 2. Set up Custom Domain (Optional)
- Add custom domain in your deployment platform
- Configure DNS settings
- Update OAuth redirect URLs

### 3. Monitor and Scale
- Set up monitoring (Vercel Analytics, etc.)
- Monitor database performance
- Set up error tracking (Sentry, etc.)

## Troubleshooting

### Common Issues:

1. **Database Connection Errors:**
   - Check DATABASE_URL format
   - Ensure SSL is configured for production
   - Verify database is accessible

2. **OAuth Errors:**
   - Check redirect URLs match exactly
   - Verify client IDs and secrets
   - Ensure domains are authorized

3. **API Key Errors:**
   - Switch from test to live keys
   - Check API quotas and billing
   - Verify API permissions

4. **Build Errors:**
   - Check Node.js version compatibility
   - Verify all dependencies are installed
   - Check for TypeScript errors

## Security Checklist

- [ ] Use strong SESSION_SECRET
- [ ] Enable HTTPS (automatic on most platforms)
- [ ] Use production API keys
- [ ] Configure CORS properly
- [ ] Set up rate limiting
- [ ] Enable security headers
- [ ] Regular dependency updates

## Cost Optimization

- **Vercel:** Free tier includes 100GB bandwidth/month
- **Railway:** Free tier includes $5 credit/month
- **Render:** Free tier available for web services
- **Neon:** Free tier includes 3GB storage and 10GB transfer
- **Supabase:** Free tier includes 500MB database

## Support

If you encounter issues:
1. Check deployment platform logs
2. Verify environment variables
3. Test locally with production config
4. Check API documentation for rate limits
5. Monitor database performance
