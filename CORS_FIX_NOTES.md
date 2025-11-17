# CORS Fix for Mobile App

## The Problem

When making requests from the React Native mobile app with `credentials: 'include'`, the browser blocks the request with this error:

```
Access to fetch at 'https://kindreddev.tanushchauhan.com/api/auth/login'
from origin 'http://localhost:8081' has been blocked by CORS policy:
Response to preflight request doesn't pass access control check:
The value of the 'Access-Control-Allow-Origin' header in the response
must not be the wildcard '*' when the request's credentials mode is 'include'.
```

## The Solution

Updated `middleware.ts` to:

1. ✅ Check the request origin
2. ✅ Set specific `Access-Control-Allow-Origin` header (not `*`)
3. ✅ Add `Access-Control-Allow-Credentials: true`
4. ✅ Allow local network IPs (192.168.x.x, 10.0.x.x) for development

## Important: Don't Use `credentials: 'include'` for Bearer Token Auth

When using Bearer token authentication, you should **NOT** use `credentials: 'include'` in your fetch requests.

### ❌ WRONG (will cause CORS error):

```javascript
const response = await fetch(
  "https://kindreddev.tanushchauhan.com/api/auth/login",
  {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include", // ❌ DON'T USE THIS with Bearer tokens
    body: JSON.stringify({
      email: "user@example.com",
      password: "password123",
    }),
  }
);
```

### ✅ CORRECT (for Bearer token auth):

```javascript
const response = await fetch(
  "https://kindreddev.tanushchauhan.com/api/auth/login",
  {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    // No credentials option needed for Bearer tokens
    body: JSON.stringify({
      email: "user@example.com",
      password: "password123",
    }),
  }
);

const data = await response.json();
const token = data.session.access_token;

// For authenticated requests, use Authorization header
const profileResponse = await fetch(
  "https://kindreddev.tanushchauhan.com/api/me",
  {
    headers: {
      Authorization: `Bearer ${token}`,
    },
    // Still no credentials option needed
  }
);
```

## Why?

- **`credentials: 'include'`** is for cookie-based authentication (web app)
- **Bearer tokens** don't need cookies, they go in the Authorization header
- Using both causes CORS complications

## What Changed in Middleware

### Before:

```typescript
response.headers.set("Access-Control-Allow-Origin", "*");
```

### After:

```typescript
const origin = request.headers.get("origin");
let allowOrigin = origin || "*"; // Use specific origin if present
response.headers.set("Access-Control-Allow-Origin", allowOrigin);
response.headers.set("Access-Control-Allow-Credentials", "true");
```

## Allowed Origins (Development)

The middleware now allows:

- ✅ `http://localhost:8081` (React Native Metro)
- ✅ `http://localhost:19006` (Expo web)
- ✅ `http://192.168.x.x:8081` (Local network IPs)
- ✅ `http://10.0.x.x:8081` (iOS simulator network)

## Testing After Fix

1. Remove `credentials: 'include'` from your fetch calls
2. Redeploy the backend with updated middleware
3. Test from mobile app

```javascript
// Test login
const loginResponse = await fetch(
  "https://kindreddev.tanushchauhan.com/api/auth/login",
  {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: "test@example.com", password: "password" }),
  }
);

const { session } = await loginResponse.json();

// Test Bearer token
const meResponse = await fetch("https://kindreddev.tanushchauhan.com/api/me", {
  headers: { Authorization: `Bearer ${session.access_token}` },
});

const profile = await meResponse.json();
console.log("Profile:", profile); // Should work! ✅
```

## Status

- ✅ CORS middleware updated
- ✅ Committed to `dev` branch (commit `2c53799`)
- ✅ Pushed to remote
- ⏳ **Waiting for backend deployment**

## Next Steps

1. Backend team deploys from `dev` branch
2. Test from mobile app without `credentials: 'include'`
3. Verify Bearer token authentication works

---

**Last Updated:** November 16, 2025  
**Commit:** 2c53799 - "fix: update CORS middleware to allow credentials and specific origins for mobile app"
