# Mobile App Authentication Guide

## Overview

The backend now supports **dual authentication methods**:
1. **Cookie-based authentication** (for web app, same-origin)
2. **Bearer token authentication** (for mobile app, cross-origin)

## How It Works

The authentication middleware in `lib/supabaseServer.ts` checks for authentication in this order:

1. **First**: Checks for `Authorization: Bearer <token>` header
2. **Fallback**: Uses session cookies if no Bearer token is present

This means:
- ✅ Web app continues to work with cookies (same-origin)
- ✅ Mobile app can use Authorization header (cross-origin)
- ✅ Both work seamlessly with the same backend

## Mobile App Implementation

### 1. Sign In / Sign Up Flow

When the user successfully signs in or signs up, the API returns:

```json
{
  "success": true,
  "message": "Signed in successfully",
  "user": {
    "id": "user-uuid",
    "email": "user@example.com",
    "name": "User Name"
  },
  "session": {
    "access_token": "eyJhbGc...",
    "refresh_token": "eyJhbGc..."
  }
}
```

### 2. Store the Tokens

Save both tokens securely in your mobile app:

```javascript
// React Native example with AsyncStorage
import AsyncStorage from '@react-native-async-storage/async-storage';

// After successful login
const response = await fetch('https://your-api.com/api/auth/signin', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    email: 'user@example.com',
    password: 'password123',
  }),
});

const data = await response.json();

if (data.success && data.session) {
  // Store tokens
  await AsyncStorage.setItem('access_token', data.session.access_token);
  await AsyncStorage.setItem('refresh_token', data.session.refresh_token);
  await AsyncStorage.setItem('user', JSON.stringify(data.user));
}
```

### 3. Make Authenticated Requests

For **all protected API requests**, include the `Authorization` header:

```javascript
// React Native example
const makeAuthenticatedRequest = async (endpoint, options = {}) => {
  const accessToken = await AsyncStorage.getItem('access_token');
  
  if (!accessToken) {
    throw new Error('No access token available');
  }
  
  const response = await fetch(`https://your-api.com${endpoint}`, {
    ...options,
    headers: {
      ...options.headers,
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${accessToken}`,
    },
  });
  
  return response;
};

// Example: Fetch current user profile
const fetchProfile = async () => {
  try {
    const response = await makeAuthenticatedRequest('/api/me');
    const data = await response.json();
    
    if (response.ok) {
      console.log('User profile:', data);
    } else {
      console.error('Error:', data.error);
    }
  } catch (error) {
    console.error('Network error:', error);
  }
};

// Example: Submit onboarding data
const submitOnboarding = async (formData) => {
  try {
    const response = await makeAuthenticatedRequest('/api/me/onboarding', {
      method: 'POST',
      body: JSON.stringify(formData),
    });
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error submitting onboarding:', error);
    throw error;
  }
};
```

### 4. Handle Token Refresh

When the access token expires (you'll get a 401 error), use the refresh token:

```javascript
const refreshAccessToken = async () => {
  try {
    const refreshToken = await AsyncStorage.getItem('refresh_token');
    
    if (!refreshToken) {
      throw new Error('No refresh token available');
    }
    
    const response = await fetch('https://your-api.com/api/auth/refresh', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        refresh_token: refreshToken,
      }),
    });
    
    const data = await response.json();
    
    if (data.success && data.session) {
      // Store new tokens
      await AsyncStorage.setItem('access_token', data.session.access_token);
      await AsyncStorage.setItem('refresh_token', data.session.refresh_token);
      return data.session.access_token;
    } else {
      // Refresh failed, user needs to log in again
      throw new Error('Token refresh failed');
    }
  } catch (error) {
    console.error('Token refresh error:', error);
    // Clear tokens and redirect to login
    await AsyncStorage.multiRemove(['access_token', 'refresh_token', 'user']);
    throw error;
  }
};

// Enhanced authenticated request with auto-retry
const makeAuthenticatedRequestWithRetry = async (endpoint, options = {}) => {
  let accessToken = await AsyncStorage.getItem('access_token');
  
  if (!accessToken) {
    throw new Error('No access token available');
  }
  
  const response = await fetch(`https://your-api.com${endpoint}`, {
    ...options,
    headers: {
      ...options.headers,
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${accessToken}`,
    },
  });
  
  // If 401, try refreshing the token once
  if (response.status === 401) {
    try {
      accessToken = await refreshAccessToken();
      
      // Retry the original request with new token
      const retryResponse = await fetch(`https://your-api.com${endpoint}`, {
        ...options,
        headers: {
          ...options.headers,
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
        },
      });
      
      return retryResponse;
    } catch (error) {
      // Refresh failed, user needs to log in again
      throw new Error('Authentication failed. Please log in again.');
    }
  }
  
  return response;
};
```

### 5. Sign Out

```javascript
const signOut = async () => {
  try {
    // Call the sign out endpoint (optional, clears server-side session)
    const accessToken = await AsyncStorage.getItem('access_token');
    if (accessToken) {
      await fetch('https://your-api.com/api/auth/signout', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      });
    }
  } catch (error) {
    console.error('Sign out error:', error);
  } finally {
    // Clear local storage
    await AsyncStorage.multiRemove(['access_token', 'refresh_token', 'user']);
    // Navigate to login screen
  }
};
```

## Testing the Implementation

### Test 1: Verify Bearer Token Authentication

```bash
# 1. Sign in and get the access token
curl -X POST http://localhost:3000/api/auth/signin \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123"
  }'

# Response will include access_token
# Copy the access_token from the response

# 2. Test authenticated endpoint with Bearer token
curl -X GET http://localhost:3000/api/me \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN_HERE"

# Should return user profile data
```

### Test 2: Verify Web App Still Works

The web app should continue to work normally with cookies - no changes needed on the frontend.

### Test 3: Test from Mobile App

```javascript
// In your React Native app
const testAuth = async () => {
  // 1. Sign in
  const loginResponse = await fetch('http://YOUR_SERVER_IP:3000/api/auth/signin', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      email: 'test@example.com',
      password: 'password123',
    }),
  });
  
  const loginData = await loginResponse.json();
  console.log('Login response:', loginData);
  
  if (loginData.success && loginData.session) {
    // 2. Store token
    const accessToken = loginData.session.access_token;
    await AsyncStorage.setItem('access_token', accessToken);
    
    // 3. Test authenticated request
    const profileResponse = await fetch('http://YOUR_SERVER_IP:3000/api/me', {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    });
    
    const profileData = await profileResponse.json();
    console.log('Profile data:', profileData);
  }
};
```

## Common Issues and Solutions

### Issue 1: CORS Errors

If you get CORS errors when calling from mobile:

**Solution**: Add CORS configuration to your Next.js API routes. Create a middleware file:

```typescript
// middleware.ts (in project root)
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // Handle preflight requests
  if (request.method === 'OPTIONS') {
    return new NextResponse(null, {
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': '*', // or specific origin for production
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Max-Age': '86400',
      },
    });
  }

  // Add CORS headers to all responses
  const response = NextResponse.next();
  response.headers.set('Access-Control-Allow-Origin', '*');
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  return response;
}

export const config = {
  matcher: '/api/:path*',
};
```

### Issue 2: 401 Unauthorized After Token Added

Check that:
1. The token is valid and not expired
2. The Authorization header is formatted correctly: `Bearer <token>`
3. The Supabase URL and anon key environment variables are set correctly

### Issue 3: Token Expires Quickly

Supabase access tokens typically expire after 1 hour. Implement token refresh as shown above.

## Security Best Practices

1. **Never** store tokens in plain AsyncStorage in production - use secure storage:
   - iOS: Use Keychain
   - Android: Use Android Keystore
   - Library: `react-native-keychain` or `expo-secure-store`

2. **Always** use HTTPS in production

3. **Set CORS properly** - don't use `*` in production, specify your mobile app's origin

4. **Implement token expiry handling** - auto-refresh tokens before they expire

5. **Clear tokens on sign out** - ensure tokens are removed from device

## Backend Changes Summary

The key change made to support Bearer token authentication:

**File: `lib/supabaseServer.ts`**

```typescript
// Now checks for Authorization header FIRST
const authHeader = headerStore.get("authorization");
const bearerToken = authHeader?.startsWith("Bearer ")
  ? authHeader.substring(7)
  : null;

// If Bearer token is provided, use it instead of cookies
if (bearerToken) {
  const { data, error } = await supabaseClient.auth.setSession({
    access_token: bearerToken,
    refresh_token: "",
  });
}
```

This allows all existing API routes to automatically support both authentication methods without any changes to individual route handlers.

## Questions?

If you encounter any issues or have questions about the implementation, please reach out to the backend team.
