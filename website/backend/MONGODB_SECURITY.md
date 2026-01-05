# MongoDB Connection String Security

## ⚠️ CRITICAL: Never Expose MongoDB Connection Strings

The MongoDB connection string contains **credentials** and must be kept secret at all times.

### Format
```
mongodb+srv://<username>:<password>@<cluster>.mongodb.net/<database>
```

⚠️ **Note**: Replace `<username>`, `<password>`, `<cluster>`, and `<database>` with your actual values. Never use real credentials in examples or documentation.

**This string contains:**
- Database username
- Database password
- Cluster information

## Security Measures Implemented

### 1. ✅ Environment Variable Only
- Connection string is **only** stored in `.env` file
- `.env` file is in `.gitignore` (never committed)
- Never hardcode connection strings in code

### 2. ✅ Error Message Sanitization
- All error logging uses `sanitizeMongoUri()` function
- Connection strings are automatically redacted from logs
- Pattern: `mongodb://***:***@` replaces credentials

### 3. ✅ No Logging of Connection String
- Connection string is never logged directly
- Error messages are sanitized before logging
- Only error messages (not full error objects) are logged

### 4. ✅ Production Safety
- In production, detailed errors are not logged
- Only generic error messages are shown
- Full error details only in development mode

## Best Practices

### ✅ DO:
- Store connection string in `.env` file
- Use environment variables in production
- Rotate credentials if exposed
- Use MongoDB Atlas IP whitelisting
- Use strong passwords
- Enable MongoDB Atlas authentication

### ❌ DON'T:
- Commit `.env` files to Git
- Log connection strings
- Share connection strings in chat/email
- Hardcode connection strings
- Include connection strings in error responses
- Expose connection strings in documentation (use placeholders)

## If Connection String is Exposed

1. **Immediately** change the database password in MongoDB Atlas
2. Update the connection string in all environments
3. Review access logs for unauthorized access
4. Consider rotating all credentials
5. Review security settings in MongoDB Atlas

## Example .env File

```env
# MongoDB Connection String
# NEVER commit this file!
MONGODB_URI=mongodb+srv://<username>:<password>@<cluster>.mongodb.net/<database>
PORT=3001
CORS_ORIGIN=http://localhost:5173
```

## Code Implementation

The server automatically sanitizes any MongoDB connection strings in error messages, including **partial strings**:

```javascript
function sanitizeMongoUri(str) {
  if (!str || typeof str !== 'string') return str;
  
  let sanitized = str;
  
  // Pattern 1: Full connection strings with @ symbol
  sanitized = sanitized.replace(/mongodb\+?srv?:\/\/[^@\s]+@/gi, 'mongodb://***:***@');
  sanitized = sanitized.replace(/mongodb:\/\/[^@\s]+@/gi, 'mongodb://***:***@');
  
  // Pattern 2: Partial connection strings without @ (catches incomplete leaks)
  sanitized = sanitized.replace(/mongodb\+?srv?:\/\/[^/\s:]+:[^/\s@]+/gi, 'mongodb://***:***');
  sanitized = sanitized.replace(/mongodb:\/\/[^/\s:]+:[^/\s@]+/gi, 'mongodb://***:***');
  
  // Pattern 3: Protocol with credentials pattern
  sanitized = sanitized.replace(/mongodb\+?srv?:\/\/[a-zA-Z0-9_]+:[a-zA-Z0-9_@#$%^&*()!]+/gi, 'mongodb://***:***');
  sanitized = sanitized.replace(/mongodb:\/\/[a-zA-Z0-9_]+:[a-zA-Z0-9_@#$%^&*()!]+/gi, 'mongodb://***:***');
  
  // Pattern 4: Environment variable references
  sanitized = sanitized.replace(/MONGODB_URI[=:]\s*['"]?mongodb[^'"]*['"]?/gi, 'MONGODB_URI=***');
  
  return sanitized;
}
```

### Protection Coverage

✅ **Full connection strings**: `mongodb+srv://***:***@host` (sanitized)
✅ **Partial strings**: `mongodb+srv://***:***` (sanitized)
✅ **Without @ symbol**: `mongodb://user:password` → `mongodb://***:***`
✅ **Environment variables**: `MONGODB_URI=mongodb://...` → `MONGODB_URI=***`
✅ **All variations**: Handles `mongodb://`, `mongodb+srv://`, and `mongodb+srv://`

This ensures that even if an error accidentally contains the connection string (complete or partial), it will be redacted before logging.
