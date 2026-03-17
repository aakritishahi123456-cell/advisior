# Production Deployment Guide

## Architecture Overview

This is a full-stack application with:
- **Frontend**: Next.js (deployed on Vercel) - at `advisior.vercel.app`
- **Backend**: Node.js/Express (must be deployed separately on Render.com)
- **Database**: PostgreSQL (provided by Render)
- **Cache**: Redis (provided by Render)

## Quick Fix for Network Error

The "Network error. Please check your connection" occurs because the Vercel frontend can't reach the backend API.

### Step 1: Deploy Backend to Render.com (Free)

1. Go to [Render.com](https://render.com) and sign up
2. Create a new Web Service:
   - Connect your GitHub repository
   - Branch: `main`
   - Build Command: `npm run build`
   - Start Command: `npm run start`
   - Add environment variables:
     - `DATABASE_URL` - Create a PostgreSQL database on Render and get the connection string
     - `JWT_SECRET` - Generate a secure random string (use a password generator)
     - `REDIS_URL` - Create a Redis instance on Render or leave blank (will use in-memory fallback)
     - `NODE_ENV` = `production`
     - `PORT` = `3001`
3. Deploy and get your backend URL (e.g., `https://your-app.onrender.com`)

### Step 2: Configure Vercel Environment Variables

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Select your project → Settings → Environment Variables
3. Add:
   - **Name**: `NEXT_PUBLIC_API_URL`
   - **Value**: Your backend URL from Render (e.g., `https://your-app.onrender.com`)
   - **Environment**: Production
4. Go to Deployments → Redeploy the latest commit

## After Deployment

Once the backend is deployed and Vercel is configured:
1. Visit `advisior.vercel.app`
2. Try creating an account - it should work!
3. The frontend will now communicate with your production backend

## Troubleshooting

### If account creation still fails:
- Check browser console for specific error messages
- Verify the backend is running: visit `https://your-backend.onrender.com/health`
- Check that NEXT_PUBLIC_API_URL is correctly set in Vercel

### If backend fails to start on Render:
- Check the Render logs for errors
- Ensure DATABASE_URL is correctly set
- Make sure JWT_SECRET is set (required for auth to work)
