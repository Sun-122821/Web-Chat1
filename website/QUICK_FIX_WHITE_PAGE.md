# Quick Fix for White Page Issue

## Immediate Steps to Fix

### 1. Check Browser Console (MOST IMPORTANT)
1. Open your website
2. Press **F12** (or right-click → Inspect)
3. Click **Console** tab
4. Look for **RED error messages**
5. **Copy the error message** - this tells us what's wrong

### 2. Verify Dependencies Are Installed
```bash
cd frontend
npm install
```

### 3. Make Sure Dev Server is Running
```bash
cd frontend
npm run dev
```

You should see:
```
  VITE v5.x.x  ready in xxx ms
  ➜  Local:   http://localhost:5173/
```

### 4. Clear Browser Cache
- Press **Ctrl + Shift + Delete**
- Clear cache and cookies
- Or use **Incognito/Private mode**

### 5. Check if Backend is Running
```bash
cd backend
npm run dev
```

Should see: `🚀 Server running on port 3001`

## Common Causes

### Cause 1: JavaScript Error
**Symptom**: White page, errors in console
**Fix**: Check console for specific error, fix the issue

### Cause 2: Missing Dependencies
**Symptom**: "Cannot find module" errors
**Fix**: 
```bash
cd frontend
npm install
```

### Cause 3: Backend Not Running
**Symptom**: "Failed to fetch" errors
**Fix**: Start backend server

### Cause 4: Port Already in Use
**Symptom**: Server won't start
**Fix**: Kill process using port or change port

### Cause 5: Build/Bundle Issue
**Symptom**: Files not loading
**Fix**: 
```bash
cd frontend
rm -rf node_modules/.vite dist
npm run dev
```

## Diagnostic Commands

```bash
# Check Node version (should be 18+)
node --version

# Check if ports are in use
# Windows:
netstat -ano | findstr :5173
netstat -ano | findstr :3001

# Reinstall everything
cd frontend
rm -rf node_modules package-lock.json
npm install
npm run dev
```

## What to Share for Help

1. **Browser console errors** (screenshot or copy text)
2. **Network tab** - any failed requests?
3. **Terminal output** - what does `npm run dev` show?
4. **Browser** - which browser are you using?

## Expected Behavior

When working correctly, you should see:
- Purple gradient background
- "🔐 Secure Messaging" heading
- Login form with nickname input
- "Start Chatting" button

If you see only "Web-Chat" text, React is not rendering. Check console for errors!
