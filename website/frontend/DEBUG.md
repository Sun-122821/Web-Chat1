# Debugging White Page Issue

## If you see only "Web-Chat" or blank white page:

### Step 1: Check Browser Console
1. Press **F12** (or right-click → Inspect)
2. Go to **Console** tab
3. Look for **red error messages**
4. Share the error message

### Step 2: Check Network Tab
1. Press **F12** → **Network** tab
2. Refresh the page
3. Look for **failed requests** (red)
4. Check if `/src/main.jsx` loads successfully

### Step 3: Verify Dependencies
```bash
cd frontend
npm install
```

### Step 4: Check if Dev Server is Running
```bash
cd frontend
npm run dev
```

Should see:
```
  VITE v5.x.x  ready in xxx ms

  ➜  Local:   http://localhost:5173/
  ➜  Network: use --host to expose
```

### Step 5: Common Issues

#### Issue: "Cannot find module"
**Fix**: Run `npm install` in frontend folder

#### Issue: "Failed to fetch" or CORS errors
**Fix**: Make sure backend is running on port 3001

#### Issue: Blank page with no errors
**Fix**: 
1. Clear browser cache (Ctrl+Shift+Delete)
2. Hard refresh (Ctrl+F5)
3. Try incognito mode

#### Issue: "React is not defined"
**Fix**: 
```bash
cd frontend
npm install react react-dom
```

### Step 6: Test Build
```bash
cd frontend
npm run build
npm run preview
```

If preview works, the issue is with dev server.
If preview doesn't work, there's a code issue.

## Quick Fixes

1. **Delete node_modules and reinstall**:
   ```bash
   cd frontend
   rm -rf node_modules package-lock.json
   npm install
   ```

2. **Clear Vite cache**:
   ```bash
   cd frontend
   rm -rf node_modules/.vite
   npm run dev
   ```

3. **Check Node version**:
   ```bash
   node --version
   # Should be 18 or higher
   ```

## Still Not Working?

1. Open browser console (F12)
2. Copy ALL error messages
3. Check Network tab for failed requests
4. Share the errors for help
