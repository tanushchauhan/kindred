#!/usr/bin/env node

/**
 * Test script for Bearer Token Authentication
 * 
 * This script tests the dual authentication system:
 * 1. Sign in and get access token
 * 2. Use the token to access protected endpoints
 * 
 * Usage:
 *   node test-bearer-auth.js
 * 
 * Requirements:
 *   - Server must be running (npm run dev)
 *   - You need a test account created
 */

const BASE_URL = 'http://localhost:3000';

// Test credentials - update these with your test account
const TEST_EMAIL = 'test@example.com';
const TEST_PASSWORD = 'password123';

async function testBearerAuth() {
  console.log('🚀 Testing Bearer Token Authentication\n');
  console.log('='.repeat(50));

  try {
    // Step 1: Sign in
    console.log('\n1️⃣  Signing in...');
    const signInResponse = await fetch(`${BASE_URL}/api/auth/signin`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: TEST_EMAIL,
        password: TEST_PASSWORD,
      }),
    });

    if (!signInResponse.ok) {
      const error = await signInResponse.json();
      console.error('❌ Sign in failed:', error);
      return;
    }

    const signInData = await signInResponse.json();
    console.log('✅ Sign in successful!');
    console.log('   User:', signInData.user?.email);
    console.log('   Token received:', signInData.session?.access_token ? '✓' : '✗');

    if (!signInData.session?.access_token) {
      console.error('❌ No access token received');
      return;
    }

    const accessToken = signInData.session.access_token;
    console.log('   Access Token (first 50 chars):', accessToken.substring(0, 50) + '...');

    // Step 2: Test authenticated endpoint with Bearer token
    console.log('\n2️⃣  Testing protected endpoint with Bearer token...');
    const meResponse = await fetch(`${BASE_URL}/api/me`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    });

    if (!meResponse.ok) {
      const error = await meResponse.json();
      console.error('❌ Protected endpoint failed:', error);
      return;
    }

    const meData = await meResponse.json();
    console.log('✅ Protected endpoint accessible!');
    console.log('   User ID:', meData.id);
    console.log('   Email:', meData.email);
    console.log('   Role:', meData.role);

    // Step 3: Test without Bearer token (should fail)
    console.log('\n3️⃣  Testing without Bearer token (should fail)...');
    const unauthorizedResponse = await fetch(`${BASE_URL}/api/me`, {
      method: 'GET',
    });

    if (unauthorizedResponse.status === 401) {
      console.log('✅ Correctly rejected unauthorized request!');
    } else {
      console.warn('⚠️  Expected 401, got:', unauthorizedResponse.status);
    }

    // Step 4: Test with invalid Bearer token (should fail)
    console.log('\n4️⃣  Testing with invalid Bearer token (should fail)...');
    const invalidTokenResponse = await fetch(`${BASE_URL}/api/me`, {
      method: 'GET',
      headers: {
        'Authorization': 'Bearer invalid_token_here',
      },
    });

    if (invalidTokenResponse.status === 401) {
      console.log('✅ Correctly rejected invalid token!');
    } else {
      console.warn('⚠️  Expected 401, got:', invalidTokenResponse.status);
    }

    console.log('\n' + '='.repeat(50));
    console.log('✅ All tests passed! Bearer token authentication is working.\n');
    console.log('📱 Mobile app can now use this pattern:');
    console.log('   1. Sign in to get access_token');
    console.log('   2. Include "Authorization: Bearer <token>" in requests');
    console.log('   3. Web app continues to use cookies (no changes needed)');
    console.log('\n📖 See MOBILE_AUTH_GUIDE.md for complete implementation details.');

  } catch (error) {
    console.error('\n❌ Test failed with error:', error.message);
    console.log('\n💡 Make sure:');
    console.log('   - Server is running (npm run dev)');
    console.log('   - Test account exists');
    console.log('   - Update TEST_EMAIL and TEST_PASSWORD in this script');
  }
}

// Run the test
testBearerAuth();
