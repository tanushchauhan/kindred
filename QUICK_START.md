# Quick Start Guide: Testing Bearer Token Authentication

## Prerequisites
1. Server must be running: `npm run dev`
2. You need a test account (create via web UI at http://localhost:3000/auth/signup)

## Quick Test with cURL

### Step 1: Sign In and Get Token
```bash
curl -X POST http://localhost:3000/api/auth/signin \
  -H "Content-Type: application/json" \
  -d '{
    "email": "your-test@example.com",
    "password": "your-password"
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Signed in successfully",
  "user": {
    "id": "...",
    "email": "your-test@example.com",
    "name": "Your Name"
  },
  "session": {
    "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refresh_token": "..."
  }
}
```

### Step 2: Copy Access Token
Copy the `access_token` value from the response.

### Step 3: Test Protected Endpoint
```bash
# Replace YOUR_ACCESS_TOKEN with the token from Step 1
curl -X GET http://localhost:3000/api/me \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

**Expected Response:**
```json
{
  "id": "...",
  "email": "your-test@example.com",
  "full_name": "Your Name",
  "role": "client",
  "client_profiles": {
    "user_id": "...",
    "onboarding_data": null
  }
}
```

### Step 4: Test Without Token (Should Fail)
```bash
curl -X GET http://localhost:3000/api/me
```

**Expected Response:**
```json
{
  "error": "Unauthorized"
}
```
**Status Code:** 401

## Test with Node.js Script

```bash
# Update test-bearer-auth.js with your test credentials
# Then run:
node test-bearer-auth.js
```

## Mobile App Integration (React Native)

### 1. Install Dependencies
```bash
npm install @react-native-async-storage/async-storage
```

### 2. Create Auth Service
```javascript
// services/authService.js
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_URL = 'http://YOUR_SERVER_IP:3000/api';

export const authService = {
  async signIn(email, password) {
    const response = await fetch(`${API_URL}/auth/signin`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    });
    
    const data = await response.json();
    
    if (data.success && data.session) {
      await AsyncStorage.setItem('access_token', data.session.access_token);
      await AsyncStorage.setItem('refresh_token', data.session.refresh_token);
      await AsyncStorage.setItem('user', JSON.stringify(data.user));
    }
    
    return data;
  },

  async getProfile() {
    const token = await AsyncStorage.getItem('access_token');
    
    const response = await fetch(`${API_URL}/me`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
    
    return response.json();
  },

  async signOut() {
    const token = await AsyncStorage.getItem('access_token');
    
    await fetch(`${API_URL}/auth/signout`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
    
    await AsyncStorage.multiRemove(['access_token', 'refresh_token', 'user']);
  },
};
```

### 3. Use in Components
```javascript
// screens/ProfileScreen.js
import { useEffect, useState } from 'react';
import { View, Text } from 'react-native';
import { authService } from '../services/authService';

export default function ProfileScreen() {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const data = await authService.getProfile();
      setProfile(data);
    } catch (error) {
      console.error('Failed to load profile:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <Text>Loading...</Text>;
  }

  return (
    <View>
      <Text>Email: {profile?.email}</Text>
      <Text>Name: {profile?.full_name}</Text>
      <Text>Role: {profile?.role}</Text>
    </View>
  );
}
```

## Troubleshooting

### Problem: Connection Refused
**Solution:** Update API URL with your computer's IP address:
```bash
# Find your IP
ipconfig  # Windows
ifconfig  # Mac/Linux

# Update API_URL in your mobile app
const API_URL = 'http://192.168.1.XXX:3000/api';
```

### Problem: CORS Errors
**Solution:** Make sure `middleware.ts` exists in project root and server is restarted.

### Problem: 401 Unauthorized
**Check:**
1. Token format: `Authorization: Bearer <token>` (note the space)
2. Token not expired (default: 1 hour)
3. Environment variables are set correctly

### Problem: Token Expired
**Solution:** Implement token refresh:
```javascript
async refreshToken() {
  const refreshToken = await AsyncStorage.getItem('refresh_token');
  
  const response = await fetch(`${API_URL}/auth/refresh`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refresh_token: refreshToken }),
  });
  
  const data = await response.json();
  
  if (data.success && data.session) {
    await AsyncStorage.setItem('access_token', data.session.access_token);
    await AsyncStorage.setItem('refresh_token', data.session.refresh_token);
    return data.session.access_token;
  }
  
  throw new Error('Token refresh failed');
}
```

## What Works Now

✅ **Web App**: Uses cookies (no changes needed)  
✅ **Mobile App**: Uses Bearer tokens (new feature)  
✅ **Both**: Work with same backend simultaneously  
✅ **All API Routes**: Automatically support both methods  

## Need More Help?

- Full implementation guide: `MOBILE_AUTH_GUIDE.md`
- Technical details: `IMPLEMENTATION_SUMMARY.md`
- Code examples in both guides

## Success Criteria

You'll know it's working when:
1. ✅ Web app still works normally
2. ✅ Mobile app can sign in and get access_token
3. ✅ Mobile app can access protected endpoints with Bearer token
4. ✅ Invalid tokens are rejected (401)
5. ✅ Requests without auth are rejected (401)

---

**Ready to integrate?** Start with the cURL tests above, then move to your mobile app! 🚀
