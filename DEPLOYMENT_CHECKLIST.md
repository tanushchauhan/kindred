# Deployment Checklist: Bearer Token Authentication

## Current Status
- ✅ Code changes committed locally (commit `d8a6d79`)
- ✅ Changes pushed to GitHub (`origin/main`)
- ❌ **Production server NOT updated yet** (kindreddev.tanushchauhan.com)

## Issue Description
The Bearer token authentication is working locally but **NOT deployed** to production:
- ✅ Login returns `access_token` correctly on production
- ❌ Using `Authorization: Bearer <token>` returns 401 Unauthorized
- **Root Cause**: The middleware changes haven't been deployed to production server

## Files That Need to Be Deployed

### 1. Core Authentication Changes
- ✅ `lib/supabaseServer.ts` - **CRITICAL** - Contains Bearer token logic
- ✅ `middleware.ts` - **CRITICAL** - Contains CORS headers
- ✅ `.env` - Must include `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- ✅ `app/api/professionals/[username]/route.ts` - Fixed Next.js 16 compatibility
- ✅ `package.json` - Updated with `@supabase/ssr` dependency

### 2. Documentation (Optional)
- `MOBILE_AUTH_GUIDE.md`
- `IMPLEMENTATION_SUMMARY.md`
- `QUICK_START.md`
- `test-bearer-auth.js`

## Verification Steps for Backend Developer

### Step 1: Verify Code is on GitHub
```bash
# Check the latest commit on GitHub
git log origin/main --oneline -3

# Should show:
# d8a6d79 Add Bearer token authentication and CORS middleware
```

### Step 2: Check Deployment Platform
Depending on where you're hosting (Vercel, Netlify, etc.):

#### If using Vercel:
1. Go to https://vercel.com/dashboard
2. Find the project: ConvergentF25-1
3. Check "Deployments" tab
4. Verify latest deployment is from commit `d8a6d79`
5. Check deployment logs for errors

#### If using Netlify:
1. Go to https://app.netlify.com/
2. Find the site
3. Check "Deploys" tab
4. Verify latest deployment is from commit `d8a6d79`
5. Check build logs for errors

#### If using custom server:
1. SSH into the server
2. Pull latest changes: `git pull origin main`
3. Install dependencies: `npm install`
4. Build: `npm run build`
5. Restart the server: `pm2 restart all` (or your process manager)

### Step 3: Verify Environment Variables
**CRITICAL**: Ensure these environment variables are set in production:
```bash
NEXT_PUBLIC_SUPABASE_URL=https://nqgxhjwifnoxddbazusg.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5xZ3hoandpZm5veGRkYmF6dXNnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjEzNjkwNTYsImV4cCI6MjA3Njk0NTA1Nn0.O-jeg8mXPAuHn447ViUGocT-fLX1DMZ7XCMZ4eBkN3Q

# Also keep the non-prefixed versions:
SUPABASE_URL=https://nqgxhjwifnoxddbazusg.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5xZ3hoandpZm5veGRkYmF6dXNnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjEzNjkwNTYsImV4cCI6MjA3Njk0NTA1Nn0.O-jeg8mXPAuHn447ViUGocT-fLX1DMZ7XCMZ4eBkN3Q
```

### Step 4: Verify Dependencies are Installed
Check that these packages are installed in production:
```bash
npm list @supabase/ssr @supabase/supabase-js

# Should show:
# @supabase/ssr@0.7.0
# @supabase/supabase-js@2.76.1
```

## Production Testing Commands

### Test 1: Login (Should Already Work)
```bash
curl -X POST https://kindreddev.tanushchauhan.com/api/auth/signin \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123"
  }'
```
**Expected**: Returns `access_token` ✅ (Already working)

### Test 2: Bearer Token Auth (Currently Failing)
```bash
# Use the access_token from Test 1
curl -X GET https://kindreddev.tanushchauhan.com/api/me \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN_HERE"
```
**Expected**: Returns user profile (200 OK)
**Current**: Returns 401 Unauthorized ❌

### Test 3: CORS Headers (New Feature)
```bash
curl -I -X OPTIONS https://kindreddev.tanushchauhan.com/api/me \
  -H "Origin: http://localhost:8081" \
  -H "Access-Control-Request-Method: GET" \
  -H "Access-Control-Request-Headers: Authorization"
```
**Expected**: Should return CORS headers:
```
Access-Control-Allow-Origin: *
Access-Control-Allow-Methods: GET, POST, PUT, DELETE, PATCH, OPTIONS
Access-Control-Allow-Headers: Content-Type, Authorization
```

## Common Deployment Issues

### Issue 1: Deployment didn't trigger
**Check**: Is GitHub connected to your deployment platform?
**Solution**: 
- Verify webhook is set up in GitHub repo settings
- Manually trigger deployment from platform dashboard

### Issue 2: Build failed
**Check**: Deployment logs for errors
**Common causes**:
- Missing environment variables
- Dependencies not installed
- TypeScript errors

**Solution**:
```bash
# Locally verify build works:
npm run build

# If it succeeds locally but fails in deployment:
# - Check Node.js version matches (should be 18+)
# - Verify all files are committed and pushed
```

### Issue 3: Old code still running
**Check**: Are you caching old builds?
**Solution**:
- Clear deployment cache
- Force rebuild
- For manual deployments: restart the Node process

### Issue 4: Environment variables not set
**Check**: Deployment platform environment variables
**Solution**:
- Go to project settings → Environment Variables
- Add all required variables
- Trigger new deployment

## Quick Deployment Commands

### For Vercel (if using CLI):
```bash
# Deploy to production
vercel --prod

# Or link and deploy
vercel link
vercel --prod
```

### For Manual Server Deployment:
```bash
# SSH into server
ssh user@kindreddev.tanushchauhan.com

# Navigate to project
cd /path/to/ConvergentF25-1

# Pull latest changes
git pull origin main

# Install dependencies
npm install

# Set environment variables (if needed)
nano .env
# Add the NEXT_PUBLIC_ prefixed variables

# Build
npm run build

# Restart server (adjust command based on your setup)
pm2 restart all
# OR
npm run start
```

## Verification After Deployment

Once deployment is complete, run these tests in order:

1. **Test Bearer Token Auth**:
```bash
# Get fresh token
TOKEN=$(curl -s -X POST https://kindreddev.tanushchauhan.com/api/auth/signin \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}' \
  | grep -o '"access_token":"[^"]*' \
  | cut -d'"' -f4)

# Test with Bearer token
curl -X GET https://kindreddev.tanushchauhan.com/api/me \
  -H "Authorization: Bearer $TOKEN"
```

2. **Verify CORS Headers**:
```bash
curl -I https://kindreddev.tanushchauhan.com/api/me \
  -H "Authorization: Bearer $TOKEN"

# Look for these headers in response:
# Access-Control-Allow-Origin: *
# Access-Control-Allow-Methods: GET, POST, PUT, DELETE, PATCH, OPTIONS
```

3. **Test from Mobile App**:
Use the React Native app to test the actual integration.

## Success Criteria

✅ Bearer token authentication returns 200 OK (not 401)
✅ CORS headers are present in responses
✅ Mobile app can successfully call protected endpoints
✅ Web app still works with cookies (unchanged)

## Rollback Plan (If Issues Occur)

If deployment causes issues:
```bash
# Revert to previous commit
git revert d8a6d79

# Or checkout previous version
git checkout 1bf065b

# Push and redeploy
git push origin main
```

## Timeline

- **Committed**: November 16, 2025
- **Deployment Status**: ⏳ Pending
- **Last Verified**: Production still on old code

## Contact

If you encounter issues during deployment:
1. Check deployment logs first
2. Verify all files from "Files That Need to Be Deployed" section are present
3. Test locally first: `npm run build && npm run start`
4. Check this checklist step by step

---

## Quick Message for Backend Developer

**Hey! The Bearer token authentication changes are ready but not deployed yet.**

**What's wrong:**
- ✅ Login returns `access_token` ✓
- ❌ Bearer token auth returns 401 ✗

**What needs to happen:**
1. Pull latest code from GitHub (`d8a6d79` commit)
2. Ensure `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` are in production env vars
3. Run `npm install` (new `@supabase/ssr` package required)
4. Deploy/rebuild the app
5. Test with: `curl -X GET https://kindreddev.tanushchauhan.com/api/me -H "Authorization: Bearer <token>"`

**Files changed:**
- `lib/supabaseServer.ts` (Bearer token logic)
- `middleware.ts` (CORS support)
- `.env` (added NEXT_PUBLIC_ vars)

Let me know when deployed and I'll verify! 🚀
