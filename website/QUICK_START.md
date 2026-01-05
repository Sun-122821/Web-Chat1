# Quick Start Guide

Get your end-to-end encrypted messaging app running in 5 minutes!

## Prerequisites

- Node.js 18+ installed ([Download](https://nodejs.org/))
- MongoDB Atlas account (free) ([Sign up](https://www.mongodb.com/cloud/atlas))

## Step 1: Get MongoDB Connection String

1. Go to [MongoDB Atlas](https://cloud.mongodb.com)
2. Create a free cluster
3. Create a database user (username/password)
4. Whitelist your IP (or use 0.0.0.0/0 for development)
5. Click "Connect" → "Connect your application"
6. Copy the connection string
7. Replace `<password>` with your actual password

**Example format (replace placeholders with your actual values):**
```
mongodb+srv://<username>:<password>@<cluster>.mongodb.net/<database>?retryWrites=true&w=majority
```

⚠️ **SECURITY WARNING**: 
- Replace `<username>` with your MongoDB Atlas username
- Replace `<password>` with your MongoDB Atlas password  
- Replace `<cluster>` with your cluster name (e.g., `cluster0.xxxxx`)
- Replace `<database>` with your database name (e.g., `messaging`)
- Never share your actual MongoDB connection string publicly

## Step 2: Set Up Backend

```bash
# Navigate to backend folder
cd backend

# Install dependencies
npm install

# Create .env file (copy from .env.example)
# Windows (PowerShell):
Copy-Item .env.example .env

# Mac/Linux:
cp .env.example .env

# Edit .env and add your MongoDB connection string
# MONGODB_URI=your_connection_string_here
# PORT=3001
# CORS_ORIGIN=http://localhost:5173

# Start backend server
npm run dev
```

Backend should now be running on `http://localhost:3001` ✅

## Step 3: Set Up Frontend

Open a **new terminal**:

```bash
# Navigate to frontend folder
cd frontend

# Install dependencies
npm install

# Create .env file
# Windows (PowerShell):
Copy-Item .env.example .env

# Mac/Linux:
cp .env.example .env

# Edit .env (usually defaults are fine for local dev)
# VITE_API_URL=http://localhost:3001
# VITE_WS_URL=ws://localhost:3001

# Start frontend dev server
npm run dev
```

Frontend should now be running on `http://localhost:5173` ✅

## Step 4: Test It!

1. Open `http://localhost:5173` in your browser
2. Enter a nickname (e.g., "Alice")
3. Click "Start Chatting"
4. Open another browser window (or incognito)
5. Enter another nickname (e.g., "Bob")
6. Search for "Alice" and start chatting!

**Try it:**
- Send messages ✅
- See them encrypted in database ✅
- Only recipient can decrypt ✅

## Troubleshooting

### Backend won't start
- Check MongoDB connection string is correct
- Make sure MongoDB Atlas IP whitelist includes your IP
- Check port 3001 is not in use

### Frontend can't connect
- Make sure backend is running
- Check CORS_ORIGIN matches frontend URL
- Check browser console for errors

### Messages not encrypting
- Check browser console for errors
- Make sure Web Crypto API is supported (modern browsers)
- Check network tab for failed requests

### WebSocket not connecting
- Check backend is running
- Check VITE_WS_URL matches backend URL
- Try refreshing the page

## Next Steps

- Read [ARCHITECTURE.md](ARCHITECTURE.md) to understand the system
- Read [DEPLOYMENT.md](DEPLOYMENT.md) to deploy to production
- Read [SECURITY_CHECKLIST.md](SECURITY_CHECKLIST.md) for security best practices

## Common Commands

```bash
# Backend
cd backend
npm install          # Install dependencies
npm run dev          # Start dev server
npm start            # Start production server

# Frontend
cd frontend
npm install          # Install dependencies
npm run dev          # Start dev server
npm run build        # Build for production
```

## Need Help?

1. Check the browser console for errors
2. Check the terminal for server errors
3. Verify MongoDB connection
4. Check environment variables are set correctly

---

**Happy Secure Chatting! 🔐**
