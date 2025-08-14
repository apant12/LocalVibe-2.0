# Authentication Setup Guide

## Overview
This application now uses a custom authentication system with support for Google OAuth and Apple Sign-In, replacing the previous Replit authentication system.

## Local Development
For local development, the app uses a simple session-based authentication that bypasses OAuth providers. You can log in using the local development endpoints:

- `GET /api/login` - Automatically logs in a local user
- `GET /api/logout` - Logs out the current user
- `GET /api/auth/user` - Gets the current user information

## Production Authentication Setup

### Google OAuth Setup

1. Go to the [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the Google+ API
4. Go to "Credentials" and create an "OAuth 2.0 Client ID"
5. Set the authorized redirect URI to: `https://yourdomain.com/api/auth/google/callback`
6. Copy the Client ID and Client Secret

### Apple Sign-In Setup

1. Go to [Apple Developer Console](https://developer.apple.com/)
2. Create an App ID with Sign In with Apple capability
3. Create a Services ID for your web application
4. Create a private key for Sign In with Apple
5. Download the private key file
6. Note down your Team ID, Key ID, and Client ID

### Environment Variables

Add these environment variables to your `.env` file:

```bash
# Google OAuth
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"

# Apple Sign-In
APPLE_CLIENT_ID="your-apple-client-id"
APPLE_TEAM_ID="your-apple-team-id"
APPLE_KEY_ID="your-apple-key-id"
APPLE_PRIVATE_KEY="path-to-your-private-key-file"
```

## Authentication Endpoints

### Production Endpoints (when OAuth is configured)
- `GET /api/auth/google` - Initiates Google OAuth flow
- `GET /api/auth/google/callback` - Google OAuth callback
- `GET /api/auth/apple` - Initiates Apple Sign-In flow
- `GET /api/auth/apple/callback` - Apple Sign-In callback
- `GET /api/auth/logout` - Logs out the current user

### Local Development Endpoints
- `GET /api/login` - Automatically logs in a local user
- `GET /api/logout` - Logs out the current user
- `GET /api/auth/user` - Gets current user information

## Database
The application now uses a local PostgreSQL database instead of the remote Neon database. The database schema includes:

- `users` table - Stores user information
- `sessions` table - Stores session data
- `categories` table - Stores experience categories
- `experiences` table - Stores experience data
- `bookings` table - Stores booking information

## Local Database Setup

1. Install PostgreSQL: `brew install postgresql@14`
2. Start PostgreSQL: `brew services start postgresql@14`
3. Create database: `createdb localvibe`
4. Push schema: `npm run db:push`
5. Seed data: `npx tsx scripts/seed-data.ts`

## Testing Authentication

1. Start the server: `source .env && npm run dev`
2. Test local login: `curl http://localhost:3000/api/login`
3. Test user info: `curl http://localhost:3000/api/auth/user`
4. Test logout: `curl http://localhost:3000/api/logout`

## Security Notes

- The local development mode uses HTTP cookies (not secure)
- Production should use HTTPS with secure cookies
- Session secrets should be strong and unique
- OAuth credentials should be kept secure and not committed to version control
