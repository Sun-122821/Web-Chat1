# Deployment Guide

This guide will help you deploy your end-to-end encrypted messaging app to free-tier hosting services.

## Prerequisites

1. **GitHub Account** (free) - For code hosting
2. **MongoDB Atlas Account** (free tier) - Database
3. **Vercel Account** (free) - Frontend hosting
4. **Railway Account** (free tier) or **Render Account** (free tier) - Backend hosting

## Step 1: Set Up MongoDB Atlas

1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Sign up for free account
3. Create a new cluster (choose FREE tier)
4. Create a database user:
   - Go to "Database Access"
   - Click "Add New Database User"
   - Choose "Password" authentication
   - Save username and password securely
5. Whitelist IP addresses:
   - Go to "Network Access"
   - Click "Add IP Address"
   - Click "Allow Access from Anywhere" (for development)
   - Or add specific IPs for production
6. Get connection string:
   - Go to "Clusters" → "Connect"
   - Choose "Connect your application"
   - Copy the connection string
   - Replace `<password>` with your database password

**Example connection string format:**
```
mongodb+srv://<username>:<password>@<cluster>.mongodb.net/<database>?retryWrites=true&w=majority
```

⚠️ **SECURITY WARNING**: 
- Replace `<username>`, `<password>`, `<cluster>`, and `<database>` with your actual values
- Get your connection string from MongoDB Atlas dashboard
- Never commit connection strings to Git
- Never share connection strings publicly

## Step 2: Deploy Backend to Railway

### Option A: Railway (Recommended)

1. Go to [Railway](https://railway.app)
2. Sign up with GitHub
3. Click "New Project"
4. Click "Deploy from GitHub repo"
5. Select your repository
6. Railway will auto-detect Node.js
7. Add environment variables:
   - `MONGODB_URI` = Your MongoDB connection string
   - `PORT` = 3001 (or leave default)
   - `CORS_ORIGIN` = Your frontend URL (e.g., `https://your-app.vercel.app`)
8. Railway will deploy automatically
9. Copy the deployment URL (e.g., `https://your-app.railway.app`)

### Option B: Render

1. Go to [Render](https://render.com)
2. Sign up with GitHub
3. Click "New" → "Web Service"
4. Connect your GitHub repository
5. Configure:
   - **Name**: e2ee-messaging-backend
   - **Root Directory**: backend
   - **Environment**: Node
   - **Build Command**: `cd backend && npm install`
   - **Start Command**: `cd backend && npm start`
6. Add environment variables:
   - `MONGODB_URI`
   - `PORT` = 3001
   - `CORS_ORIGIN` = Your frontend URL
7. Click "Create Web Service"
8. Copy the deployment URL

## Step 3: Deploy Frontend to Vercel

1. Go to [Vercel](https://vercel.com)
2. Sign up with GitHub
3. Click "New Project"
4. Import your GitHub repository
5. Configure:
   - **Framework Preset**: Vite
   - **Root Directory**: frontend
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
6. Add environment variables:
   - `VITE_API_URL` = Your backend URL (e.g., `https://your-app.railway.app`)
   - `VITE_WS_URL` = Your backend WebSocket URL (same as API_URL)
7. Click "Deploy"
8. Vercel will give you a URL (e.g., `https://your-app.vercel.app`)

## Step 4: Update CORS Settings

After deploying frontend, update backend CORS:

1. Go to Railway/Render dashboard
2. Update `CORS_ORIGIN` environment variable to your Vercel URL
3. Redeploy backend

## Step 5: Test Deployment

1. Open your Vercel frontend URL
2. Create a test account
3. Open in two browser windows (or incognito)
4. Create two accounts and send messages
5. Verify encryption is working

## Environment Variables Summary

### Backend (.env)
```env
MONGODB_URI=mongodb+srv://<username>:<password>@<cluster>.mongodb.net/<database>
PORT=3001
CORS_ORIGIN=https://your-frontend.vercel.app
```

### Frontend (.env)
```env
VITE_API_URL=https://your-backend.railway.app
VITE_WS_URL=wss://your-backend.railway.app
```

**Note**: For WebSocket on Railway/Render, use `wss://` (secure WebSocket) instead of `ws://`

## Troubleshooting

### Backend Issues

**Problem**: Cannot connect to MongoDB
- Check MongoDB Atlas IP whitelist
- Verify connection string is correct
- Check database user credentials

**Problem**: CORS errors
- Verify `CORS_ORIGIN` matches frontend URL exactly
- Check for trailing slashes
- Ensure HTTPS is used in production

**Problem**: WebSocket not connecting
- Use `wss://` (secure) instead of `ws://`
- Check Railway/Render WebSocket support
- Verify Socket.io is configured correctly

### Frontend Issues

**Problem**: Cannot connect to backend
- Verify `VITE_API_URL` is correct
- Check backend is running
- Check CORS settings

**Problem**: Environment variables not working
- Vite requires `VITE_` prefix
- Rebuild after changing env vars
- Check browser console for errors

## Free Tier Limits

### MongoDB Atlas
- 512MB storage
- Shared CPU/RAM
- Sufficient for small to medium apps

### Vercel
- Unlimited deployments
- 100GB bandwidth/month
- Perfect for frontend hosting

### Railway
- $5 free credit/month
- ~500 hours runtime
- Auto-sleeps after inactivity

### Render
- Free tier available
- Spins down after 15 min inactivity
- Slower cold starts

## Production Checklist

- [ ] Use HTTPS everywhere
- [ ] Set up custom domain (optional)
- [ ] Enable MongoDB Atlas backups
- [ ] Set up error monitoring (Sentry free tier)
- [ ] Configure rate limiting
- [ ] Set up logging
- [ ] Test encryption end-to-end
- [ ] Verify keys are never sent to server
- [ ] Test on multiple browsers
- [ ] Mobile responsive testing

## Security Reminders

⚠️ **Never commit `.env` files to Git**
⚠️ **Use HTTPS in production**
⚠️ **Keep MongoDB credentials secret**
⚠️ **Regularly update dependencies**
⚠️ **Monitor for security vulnerabilities**

## Next Steps

After deployment:
1. Test thoroughly
2. Share with users
3. Monitor usage
4. Consider adding features:
   - File attachments
   - Group chat
   - Message search
   - User profiles

---

**Need Help?** Check the main README.md or open an issue on GitHub.
