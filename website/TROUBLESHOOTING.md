# Troubleshooting: White Page Issue

## Common Causes of White Page

### 1. **Backend Not Running**
**Symptom**: White page, console shows connection errors

**Solution**:
```bash
# Make sure backend is running
cd backend
npm install
npm run dev
```

**Check**: Open browser console (F12) and look for:
- `Failed to fetch`
- `Network error`
- `Connection refused`

### 2. **Missing Dependencies**
**Symptom**: White page, console shows import errors

**Solution**:
```bash
cd frontend
npm install
npm run dev
```

### 3. **JavaScript Errors**
**Symptom**: White page, console shows red errors

**Check Browser Console**:
1. Press `F12` to open Developer Tools
2. Go to "Console" tab
3. Look for red error messages
4. Share the error message for help

### 4. **Environment Variables Not Set**
**Symptom**: API calls failing

**Solution**:
```bash
# Create frontend/.env file
cd frontend
# Create .env file with:
VITE_API_URL=http://localhost:3001
VITE_WS_URL=ws://localhost:3001
```

### 5. **Port Already in Use**
**Symptom**: Server won't start

**Solution**:
```bash
# Check what's using port 3001 or 5173
# Windows:
netstat -ano | findstr :3001
netstat -ano | findstr :5173

# Kill the process or change ports in .env
```

## Quick Diagnostic Steps

### Step 1: Check Browser Console
1. Open your website
2. Press `F12`
3. Check "Console" tab for errors
4. Check "Network" tab for failed requests

### Step 2: Check Backend
```bash
cd backend
npm run dev
# Should see: "🚀 Server running on port 3001"
```

### Step 3: Check Frontend
```bash
cd frontend
npm run dev
# Should see: "Local: http://localhost:5173"
```

### Step 4: Test API
Open browser and go to:
```
http://localhost:3001/health
```
Should return: `{"status":"ok",...}`

## Common Error Messages

### "Failed to fetch"
- Backend not running
- Wrong API URL
- CORS issue

### "Cannot read property of undefined"
- Missing data
- Component error
- Check console for stack trace

### "Module not found"
- Missing dependencies
- Run `npm install`

### "WebSocket connection failed"
- Backend not running
- Wrong WebSocket URL
- Firewall blocking

## Still Having Issues?

1. **Clear browser cache**: Ctrl+Shift+Delete
2. **Hard refresh**: Ctrl+F5
3. **Try different browser**: Chrome, Firefox, Edge
4. **Check Node version**: `node --version` (should be 18+)
5. **Reinstall dependencies**:
   ```bash
   rm -rf node_modules package-lock.json
   npm install
   ```

## Getting Help

When asking for help, provide:
1. Browser console errors (screenshot)
2. Backend terminal output
3. Frontend terminal output
4. Steps you've already tried
