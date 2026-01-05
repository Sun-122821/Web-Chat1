# Deployment Guide for GitHub Pages

## Quick Deploy to GitHub Pages

### Step 1: Push to GitHub

```bash
# Initialize git (if not already done)
git init
git add .
git commit -m "Initial commit"

# Add your GitHub repository
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git
git branch -M main
git push -u origin main
```

### Step 2: Enable GitHub Pages

1. Go to your GitHub repository
2. Click **Settings** → **Pages**
3. Under **Source**, select **GitHub Actions**
4. The workflow will automatically deploy on push

### Step 3: Set Environment Variables (Optional)

If your backend is deployed separately:

1. Go to **Settings** → **Secrets and variables** → **Actions**
2. Add secrets:
   - `VITE_API_URL` - Your backend API URL (e.g., `https://your-backend.railway.app`)
   - `VITE_WS_URL` - Your WebSocket URL (e.g., `wss://your-backend.railway.app`)

### Step 4: Deploy Backend Separately

The frontend needs a backend server. Deploy backend to:
- **Railway** (recommended): https://railway.app
- **Render**: https://render.com
- **Heroku**: https://heroku.com

See `DEPLOYMENT.md` for detailed backend deployment instructions.

## Important Notes

⚠️ **Backend Required**: The frontend requires a running backend server. Make sure to:
1. Deploy backend first
2. Update `VITE_API_URL` and `VITE_WS_URL` in GitHub Secrets
3. Or update them in the workflow file before pushing

## Troubleshooting

### White Page After Deployment

1. **Check Browser Console** (F12) for errors
2. **Verify Backend URL**: Make sure `VITE_API_URL` is correct
3. **Check CORS**: Backend must allow your GitHub Pages domain
4. **Check Network Tab**: See if API calls are failing

### Build Fails

1. Check Node.js version (should be 18+)
2. Verify all dependencies in `package.json`
3. Check GitHub Actions logs for specific errors

### API Not Connecting

1. Update backend `CORS_ORIGIN` to include your GitHub Pages URL
2. Use HTTPS URLs (GitHub Pages uses HTTPS)
3. Update WebSocket URL to use `wss://` (secure WebSocket)

## Manual Build

To test the build locally:

```bash
cd frontend
npm run build
npm run preview
```

This will build and preview the production version locally.
