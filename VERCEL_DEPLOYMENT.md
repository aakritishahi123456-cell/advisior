# Production Deployment Guide

## Architecture Overview

This is a full-stack application with:
- **Frontend**: Next.js (deployed on Vercel) - at `advisior.vercel.app`
- **Backend**: Node.js/Express (must be deployed separately)
- **Database**: PostgreSQL
- **Cache**: Redis

## Quick Fix for Network Error

The "Network error. Please check your connection" occurs because the Vercel frontend can't reach the backend API.

### Step 1: Deploy Backend to Render.com (Free)

1. Go to [Render.com](https://render.com) and sign up
2. Create a new Web Service:
   - Connect your GitHub repository
   - Build Command: `npm run build`
   - Start Command: `npm run start`
   - Add environment variables:
     - `DATABASE_URL` - Your PostgreSQL connection string
     - `JWT_SECRET` - Generate a secure random string
     - `REDIS_URL` - Get from Render's Redis addon or use in-memory
     - `NODE_ENV` = `production`
     - `PORT` = `3001`
3. Deploy and get your backend URL (e.g., `https://your-app.onrender.com`)

### Step 2: Configure Vercel

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Select your project → Settings → Environment Variables
3. Add:
   - **Name**: `NEXT_PUBLIC_API_URL`
   - **Value**: Your backend URL (e.g., `https://your-app.onrender.com`)
4. Go to Deployments → Redeploy the latest commit

## Alternative: Deploy Both Frontend and Backend Together

If you want to host everything on your own server, use Docker:

```bash
# 1. Clone the repository
git clone https://github.com/your-username/advisior.git
cd advisior

# 2. Create production environment file
cp .env.production.example .env.production
# Edit .env.production with your values

# 3. Run with Docker
docker-compose -f docker-compose.production.yml up -d
```

## Environment Variables Required

### For Backend (server/.env)
```
DATABASE_URL=postgresql://user:password@host:5432/db
JWT_SECRET=your-secure-random-string
NODE_ENV=production
PORT=3001
```

### For Frontend (Vercel)
```
NEXT_PUBLIC_API_URL=https://your-backend-url.com
```

## After Deployment

Once the backend is deployed and Vercel is configured:
1. Visit `advisior.vercel.app`
2. Try creating an account - it should work!
3. The frontend will now communicate with your production backend
