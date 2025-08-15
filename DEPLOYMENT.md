# LocalVibe Deployment Guide

## Deploy to Vercel

### Prerequisites
1. Install Vercel CLI: `npm i -g vercel`
2. Have a Vercel account (sign up at vercel.com)

### Steps to Deploy

1. **Login to Vercel:**
   ```bash
   vercel login
   ```

2. **Deploy the app:**
   ```bash
   vercel
   ```

3. **Follow the prompts:**
   - Set up and deploy: `Y`
   - Which scope: Select your account
   - Link to existing project: `N`
   - Project name: `localvibe` (or your preferred name)
   - Directory: `.` (current directory)
   - Override settings: `N`

4. **Environment Variables (Optional):**
   If you want to add environment variables later:
   ```bash
   vercel env add VITE_MAPBOX_TOKEN
   vercel env add STRIPE_SECRET_KEY
   ```

### Manual Deployment

1. **Build the project:**
   ```bash
   npm run build
   ```

2. **Deploy:**
   ```bash
   vercel --prod
   ```

### Configuration Files

- `vercel.json` - Vercel configuration
- `.vercelignore` - Files to exclude from deployment
- `package.json` - Build scripts and dependencies

### Post-Deployment

1. Your app will be available at: `https://your-project-name.vercel.app`
2. API endpoints will be at: `https://your-project-name.vercel.app/api/*`
3. The React app will be served at the root URL

### Troubleshooting

- If you get build errors, check the Vercel logs
- Make sure all dependencies are in `package.json`
- Ensure the build script works locally first
- Check that the `vercel.json` routes are correct

### Environment Variables

Add these in Vercel dashboard if needed:
- `VITE_MAPBOX_TOKEN` - For map functionality
- `STRIPE_SECRET_KEY` - For payment processing
- `NODE_ENV` - Set to `production`
