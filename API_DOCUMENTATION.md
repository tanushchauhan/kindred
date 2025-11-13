# Kindred API Documentation

Complete API reference for the Kindred wellness platform using Next.js 15 App Router and Supabase.

## Table of Contents

1. [Authentication](#authentication)
2. [Profile Management](#profile-management)
3. [Client Features](#client-features)
   - [Onboarding](#post-apimeonboarding)
   - [AI Match Suggestions](#get-apimematch)
   - [Current Matches](#get-apimematchcurrent)
   - [Update Matches](#put-apimematchupdate)
4. [Professional Features](#professional-features)
5. [Public Directory](#public-directory)
6. [AI Matching System](#ai-matching-system)
7. [Admin Dashboard](#admin-dashboard)
8. [Error Handling](#error-handling)
9. [Environment Setup](#environment-setup)

---

## Overview

**Base URL:** `http://localhost:3000` (development) or your production domain

**Authentication:** Server-side session cookies (no tokens in requests)

**Content-Type:** `application/json` for all POST/PUT requests

**Credentials:** Include `credentials: 'include'` in fetch requests for authenticated routes

---

## Authentication

All authentication endpoints manage user sessions via HTTP-only cookies.

### POST /api/auth/signup

Create a new user account. Email confirmation is required before accessing protected routes.

**Request Body:**

```json
{
  "email": "user@example.com",
  "password": "securePassword123"
}
```

**Success Response (201):**

```json
{
  "user": {
    "id": "uuid",
    "email": "user@example.com"
  },
  "message": "Check your email to confirm account",
  "emailConfirmationRequired": true
}
```

**Error Responses:**

- `400` - Invalid email format or weak password
- `500` - Server error

---

### POST /api/auth/login

Authenticate a user and create a session.

**Request Body:**

```json
{
  "email": "user@example.com",
  "password": "securePassword123"
}
```

**Success Response (200):**

```json
{
  "session": {
    "access_token": "...",
    "refresh_token": "..."
  },
  "user": {
    "id": "uuid",
    "email": "user@example.com"
  },
  "message": "Login successful"
}
```

**Error Responses:**

- `400` - Missing email or password
- `401` - Invalid credentials
- `500` - Server error

---

### POST /api/auth/logout

Sign out the current user and clear session.

**Auth Required:** Yes

**Success Response (200):**

```json
{
  "message": "Logout successful"
}
```

**Error Responses:**

- `401` - Not authenticated
- `500` - Server error

---

### GET /api/auth/user

Get the authenticated user's basic information.

**Auth Required:** Yes

**Success Response (200):**

```json
{
  "email": "user@example.com"
}
```

**Error Responses:**

- `401` - Not authenticated

---

### DELETE /api/auth/delete-account

Permanently delete the user's account and all associated data.

**Auth Required:** Yes

**Success Response (200):**

```json
{
  "message": "Account deleted successfully"
}
```

**Error Responses:**

- `401` - Not authenticated
- `500` - Server error

---

## Profile Management

### POST /api/auth/complete-profile

Complete user profile after email confirmation. Creates records in the users table and role-specific profile tables.

**Auth Required:** Yes (confirmed email)

**Request Body:**

```json
{
  "role": "client | trainer | nutritionist",
  "fullName": "John Doe",
  "userName": "johndoe",
  "phoneNumber": "+1234567890",
  "gender": "male | female | other | prefer_not_to_say",
  "location": "New York, NY",
  "birthDate": "1990-01-15",
  "reasonForJoining": "I am a certified trainer with 5 years experience..." // Required for professionals
}
```

**Required Fields:**

- `role` (string)
- `fullName` (string)
- `userName` (string, min 3 chars, alphanumeric + hyphens/underscores only)
- `reasonForJoining` (string, required for trainer/nutritionist roles)

**Success Response (200):**

```json
{
  "message": "Profile completed successfully",
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "role": "client",
    "full_name": "John Doe",
    "user_name": "johndoe"
  }
}
```

**Error Responses:**

- `400` - Validation error (missing fields, username taken, invalid format)
- `401` - Not authenticated or email not confirmed
- `500` - Server error

**Notes:**

- Username must be unique across all users
- Professional accounts start with `is_verified: false` pending admin approval
- `reasonForJoining` field visible to admins for approval decision

---

### GET /api/auth/complete-profile

Check if the authenticated user needs to complete their profile.

**Auth Required:** Yes

**Success Response (200):**

```json
{
  "profileCompleted": true,
  "user": {
    "id": "uuid",
    "role": "client",
    "full_name": "John Doe"
  }
}
```

OR

```json
{
  "profileCompleted": false,
  "message": "Please complete your profile..."
}
```

**Error Responses:**

- `401` - Not authenticated
- `500` - Server error

---

### GET /api/check-username

Check if a username is available (for real-time validation).

**Auth Required:** No

**Query Parameters:**

- `username` (required) - The username to check

**Example:** `/api/check-username?username=johndoe`

**Success Response (200):**

```json
{
  "available": true
}
```

OR

```json
{
  "available": false
}
```

**Error Responses:**

- `400` - Missing username parameter

---

### GET /api/me

Get complete profile information for the authenticated user with role-specific data.

**Auth Required:** Yes

**Success Response (200):**

For clients:

```json
{
  "id": "uuid",
  "email": "user@example.com",
  "role": "client",
  "full_name": "John Doe",
  "user_name": "johndoe",
  "phone_number": "+1234567890",
  "gender": "male",
  "location": "New York, NY",
  "birth_date": "1990-01-15",
  "created_at": "2025-11-01T10:00:00.000Z",
  "updated_at": "2025-11-01T10:00:00.000Z",
  "client_profiles": {
    "user_id": "uuid",
    "onboarding_data": {
      "goals": ["weight_loss"],
      "fitness_level": "beginner",
      "dietary_preferences": ["vegetarian"]
    }
  }
}
```

For professionals (trainer/nutritionist):

```json
{
  "id": "uuid",
  "email": "trainer@example.com",
  "role": "trainer",
  "full_name": "Jane Smith",
  "user_name": "janesmith",
  "phone_number": "+1234567890",
  "location": "Austin, TX",
  "trainer_profiles": {
    "user_id": "uuid",
    "bio": "Experienced trainer...",
    "specialties": ["Weight Loss", "HIIT"],
    "is_verified": true,
    "reason_for_joining": "Certified trainer with 10 years..."
  }
}
```

For admins:

```json
{
  "id": "uuid",
  "email": "admin@example.com",
  "role": "admin",
  "full_name": "Admin User",
  "user_name": "adminuser"
}
```

**Error Responses:**

- `401` - Not authenticated
- `404` - Profile not complete (redirect to /auth/complete-profile)
- `500` - Server error

---

### PUT /api/profile/update

Update user profile information (available to all roles).

**Auth Required:** Yes

**Request Body:**

```json
{
  "full_name": "John Doe Updated",
  "phone_number": "+1987654321",
  "gender": "male",
  "location": "Los Angeles, CA",
  "birth_date": "1990-01-15"
}
```

**Required Fields:**

- `full_name` (string)

**Success Response (200):**

```json
{
  "message": "Profile updated successfully",
  "profile": {
    "id": "uuid",
    "full_name": "John Doe Updated",
    "phone_number": "+1987654321",
    "location": "Los Angeles, CA"
  }
}
```

**Error Responses:**

- `400` - Missing required fields
- `401` - Not authenticated
- `500` - Server error

---

## Client Features

### POST /api/me/onboarding

Save client onboarding questionnaire data.

**Auth Required:** Yes (clients only)

**Request Body:**

```json
{
  "goals": ["weight_loss", "muscle_gain"],
  "fitness_level": "beginner | intermediate | advanced",
  "dietary_preferences": ["vegetarian", "gluten_free"],
  "health_conditions": ["diabetes"],
  "additional_info": "I want to lose 30 pounds..."
}
```

**Success Response (200):**

```json
{
  "message": "Onboarding data saved successfully",
  "data": {
    "goals": ["weight_loss"],
    "fitness_level": "beginner",
    "dietary_preferences": ["vegetarian"]
  }
}
```

**Error Responses:**

- `400` - Invalid data format
- `401` - Not authenticated
- `403` - Not a client
- `500` - Server error

---

### GET /api/me/match

**[AI-POWERED]** Get personalized trainer and nutritionist recommendations using NVIDIA AI.

**IMPORTANT:** This endpoint only returns AI suggestions - it does NOT save them to the database. To actually save the selected professionals, the client must call `PUT /api/me/match/update`.

**Auth Required:** Yes (clients only)

**Two-Stage Matching:**

1. **Vector Search** - Retrieves top 10 candidates per role using NVIDIA embeddings
2. **LLM Ranking** - NVIDIA Llama 3.1 Nemotron analyzes candidates and selects best match

**Success Response (200):**

```json
{
  "matches": {
    "trainer": {
      "user_id": "uuid",
      "user_name": "johndoe",
      "full_name": "John Doe",
      "bio": "Experienced trainer specializing in...",
      "specialties": ["Weight Loss", "HIIT", "Strength Training"],
      "reasoning": "John is an excellent match because your goal of losing 30 pounds aligns perfectly with his specialty in weight loss and HIIT training..."
    },
    "nutritionist": {
      "user_id": "uuid",
      "user_name": "janesmith",
      "full_name": "Jane Smith",
      "bio": "Registered dietitian...",
      "specialties": ["Weight Management", "Plant-Based Nutrition"],
      "reasoning": "Jane specializes in weight management and plant-based nutrition, which directly aligns with your vegetarian dietary preferences..."
    }
  },
  "metadata": {
    "query_timestamp": "2025-11-13T10:30:00.000Z",
    "candidates_retrieved": {
      "trainers": 10,
      "nutritionists": 8
    },
    "processing_time_ms": 3421
  }
}
```

**Error Responses:**

- `400` - No onboarding data (complete wellness profile first)
- `401` - Not authenticated
- `403` - Not a client
- `404` - No matching professionals found
- `500` - AI service error

**Requirements:**

- Client must have completed onboarding
- At least one verified professional with embeddings in database
- NVIDIA_API_KEY configured

**Workflow:**

1. Client calls this endpoint to get AI recommendations
2. Client reviews the suggested matches (with reasoning)
3. Client decides to either:
   - Accept AI suggestions via `PUT /api/me/match/update`
   - Choose different professionals manually via `PUT /api/me/match/update`
   - Get new AI recommendations (call this endpoint again)

---

### GET /api/me/match/current

Get the client's currently saved trainer and nutritionist matches.

**Auth Required:** Yes (clients only)

**Success Response (200):**

```json
{
  "matches": {
    "trainer": {
      "user_id": "uuid",
      "user_name": "johndoe",
      "full_name": "John Doe",
      "location": "Austin, TX",
      "bio": "Experienced trainer specializing in...",
      "specialties": ["Weight Loss", "HIIT", "Strength Training"],
      "is_verified": true
    },
    "nutritionist": {
      "user_id": "uuid",
      "user_name": "janesmith",
      "full_name": "Jane Smith",
      "location": "Boston, MA",
      "bio": "Registered dietitian...",
      "specialties": ["Weight Management", "Plant-Based Nutrition"],
      "is_verified": true
    }
  },
  "metadata": {
    "created_at": "2025-11-01T10:00:00.000Z",
    "last_updated": "2025-11-13T14:30:00.000Z"
  }
}
```

**Success Response (200) - No matches:**

If either professional is not selected, the value will be `null`:

```json
{
  "matches": {
    "trainer": null,
    "nutritionist": {
      "user_id": "uuid",
      "user_name": "janesmith",
      "full_name": "Jane Smith",
      "bio": "Registered dietitian...",
      "specialties": ["Weight Management"],
      "is_verified": true
    }
  },
  "metadata": {
    "created_at": "2025-11-01T10:00:00.000Z",
    "last_updated": "2025-11-13T14:30:00.000Z"
  }
}
```

**Error Responses:**

- `401` - Not authenticated
- `403` - Not a client
- `404` - No matches found (client has never selected any professionals)

**Notes:**

- Returns the professionals currently saved in `client_matches` table
- These are the committed selections, not AI suggestions
- Used to display "My Wellness Team" on the client dashboard

---

### PUT /api/me/match/update

Save or update the client's trainer and/or nutritionist selections.

**Auth Required:** Yes (clients only)

**Request Body:**

```json
{
  "trainerId": "uuid",
  "nutritionistId": "uuid"
}
```

**Optional Fields:**

- `trainerId` (string | null) - Update trainer selection (omit to keep current)
- `nutritionistId` (string | null) - Update nutritionist selection (omit to keep current)
- Pass `null` to clear a selection

**Success Response (200):**

```json
{
  "message": "Match selection updated successfully",
  "updated": {
    "trainer": true,
    "nutritionist": true
  }
}
```

**Error Responses:**

- `400` - No fields provided, or invalid/unverified professional ID
- `401` - Not authenticated
- `403` - Not a client
- `500` - Server error

**Validation:**

- Validates that professional IDs exist and are verified
- Creates new match record if none exists for client
- Updates existing match record if one exists

**Examples:**

Update both:

```json
{
  "trainerId": "trainer-uuid",
  "nutritionistId": "nutritionist-uuid"
}
```

Update only trainer:

```json
{
  "trainerId": "trainer-uuid"
}
```

Clear trainer selection:

```json
{
  "trainerId": null
}
```

**Notes:**

- This is the ONLY endpoint that saves matches to the database
- Used for both AI-suggested matches and manual selections
- Can be called multiple times to change selections
- Automatically updates `last_updated` timestamp

---

## Professional Features

### GET /api/professionals/onboarding

Get professional's onboarding status and profile data.

**Auth Required:** Yes (trainers/nutritionists only)

**Success Response (200):**

```json
{
  "role": "trainer",
  "profile": {
    "bio": "Experienced trainer...",
    "specialties": ["Weight Loss", "HIIT"],
    "is_verified": true,
    "reason_for_joining": "Certified trainer with..."
  },
  "isVerified": true,
  "hasCompletedOnboarding": true
}
```

**Error Responses:**

- `401` - Not authenticated
- `403` - Not a professional
- `404` - Profile not found

---

### PUT /api/professionals/onboarding

Update professional profile with bio and specialties.

**Auth Required:** Yes (verified trainers/nutritionists only)

**Request Body:**

```json
{
  "bio": "Experienced personal trainer specializing in weight loss and strength training. Certified by NASM with 10+ years of experience helping clients achieve their fitness goals.",
  "specialties": [
    "Weight Loss",
    "Strength Training",
    "HIIT",
    "Custom Specialty Name"
  ]
}
```

**Required Fields:**

- `bio` (string, non-empty)
- `specialties` (array, at least one specialty)

**Success Response (200):**

```json
{
  "message": "Professional onboarding completed successfully",
  "profile": {
    "bio": "Experienced personal trainer...",
    "specialties": ["Weight Loss", "Strength Training", "HIIT"],
    "is_verified": true
  }
}
```

**Error Responses:**

- `400` - Missing or invalid fields
- `401` - Not authenticated
- `403` - Not verified (pending admin approval)
- `404` - Profile not found
- `500` - Server error

**Notes:**

- Professionals must be verified by admin before they can complete onboarding
- Both bio and specialties are used for AI matching embeddings
- Changes trigger automatic embedding regeneration via webhook

---

## Public Directory

### GET /api/professionals

List all verified trainers and nutritionists with complete profiles (public endpoint).

**Auth Required:** No

**Success Response (200):**

```json
{
  "trainers": [
    {
      "id": "uuid",
      "full_name": "John Doe",
      "user_name": "johndoe",
      "location": "Austin, TX",
      "trainer_profiles": {
        "bio": "Experienced trainer specializing in...",
        "specialties": ["Weight Loss", "HIIT", "Strength Training"],
        "is_verified": true
      }
    }
  ],
  "nutritionists": [
    {
      "id": "uuid",
      "full_name": "Jane Smith",
      "user_name": "janesmith",
      "location": "Boston, MA",
      "nutritionist_profiles": {
        "bio": "Registered dietitian focusing on...",
        "specialties": ["Weight Management", "Sports Nutrition"],
        "is_verified": true
      }
    }
  ],
  "total": {
    "trainers": 15,
    "nutritionists": 12
  }
}
```

**Visibility Rules:**

- Only `is_verified: true` professionals
- Must have non-null `bio`
- Must have `user_name` set
- Profile must be complete

**Error Responses:**

- `500` - Server error

---

### GET /api/professionals/[username]

Get individual professional profile by username (public endpoint).

**Auth Required:** No

**URL Parameter:**

- `username` - The professional's unique username

**Example:** `/api/professionals/johndoe`

**Success Response (200):**

```json
{
  "id": "uuid",
  "role": "trainer",
  "full_name": "John Doe",
  "user_name": "johndoe",
  "location": "Austin, TX",
  "profile": {
    "bio": "Experienced personal trainer with 10+ years...",
    "specialties": ["Weight Loss", "HIIT", "Strength Training"],
    "is_verified": true
  }
}
```

**Error Responses:**

- `400` - Username missing
- `404` - Professional not found, not verified, or profile incomplete
- `500` - Server error

---

## AI Matching System

The AI matching system uses NVIDIA's embedding and LLM models for semantic search and intelligent ranking.

### Architecture

**Embedding Model:** `nvidia/nv-embedqa-e5-v5` (1024 dimensions)

- Input type: `"passage"` for professional profiles
- Input type: `"query"` for client searches

**LLM Model:** `nvidia/llama-3.1-nemotron-ultra-253b-v1` (253B parameters)

- Used for final ranking and reasoning generation

**Database:** PostgreSQL with pgvector extension

- HNSW indexing for fast similarity search
- Cosine similarity metric

### Document Format

Professional profiles are embedded as:

```
Professional Bio: [bio text]

Areas of Expertise: [specialty1, specialty2, specialty3]
```

### Automatic Embedding Generation

Embeddings are automatically generated via Supabase webhook when:

- New professional creates profile (INSERT)
- Professional updates bio or specialties (UPDATE with changes)
- Only if bio and specialties are non-null/non-empty

### POST /api/admin/generate-embeddings

**[ADMIN ONLY]** Bulk generate or regenerate embeddings for existing professionals.

**Auth Required:** Yes (Admin role)

**Query Parameters:**

- `type` (optional): `"trainers" | "nutritionists" | "all"` (default: `"all"`)

**Example:** `/api/admin/generate-embeddings?type=trainers`

**Success Response (200):**

```json
{
  "message": "Embedding generation complete",
  "results": {
    "trainers": {
      "processed": 15,
      "success": 15,
      "failed": 0,
      "errors": []
    },
    "nutritionists": {
      "processed": 12,
      "success": 11,
      "failed": 1,
      "errors": ["user_id xyz: Missing bio"]
    }
  },
  "timestamp": "2025-11-13T10:30:00.000Z"
}
```

**Error Responses:**

- `401` - Not authenticated
- `403` - Not an admin
- `500` - Server error or NVIDIA API error

**Notes:**

- Only processes verified professionals with bio and specialties
- Uses exponential backoff retry logic (5 attempts)
- Safe to re-run to update all embeddings
- Used for initial setup or after changing embedding model

---

## Admin Dashboard

Admin endpoints are protected with server-side role verification.

### GET /api/admin/verify

Verify admin access (used by admin dashboard).

**Auth Required:** Yes (Admin role)

**Success Response (200):**

```json
{
  "authorized": true,
  "userId": "uuid"
}
```

**Error Responses:**

- `401` - Not authenticated
- `403` - Not an admin
- `500` - Server error

---

### GET /api/admin/stats

Get comprehensive platform statistics.

**Auth Required:** Yes (Admin role)

**Success Response (200):**

```json
{
  "timestamp": "2025-11-13T10:30:00.000Z",
  "users": {
    "total": 150,
    "clients": 120,
    "trainers": 20,
    "nutritionists": 9,
    "admins": 1
  },
  "clients": {
    "total": 120,
    "completedOnboarding": 95,
    "pendingOnboarding": 25
  },
  "professionals": {
    "trainers": {
      "total": 20,
      "verified": 15,
      "withEmbeddings": 15,
      "needingEmbeddings": 0
    },
    "nutritionists": {
      "total": 9,
      "verified": 7,
      "withEmbeddings": 6,
      "needingEmbeddings": 1
    },
    "embeddingCoverage": {
      "trainers": 100,
      "nutritionists": 85.71
    }
  },
  "aiMatching": {
    "readyForMatching": 95,
    "availableTrainers": 15,
    "availableNutritionists": 6,
    "potentialMatches": 1425
  }
}
```

**Error Responses:**

- `401` - Not authenticated
- `403` - Not an admin
- `500` - Server error

---

### GET /api/admin/pending-professionals

Get list of professionals awaiting verification with their application details.

**Auth Required:** Yes (Admin role)

**Success Response (200):**

```json
{
  "trainers": [
    {
      "user_id": "uuid",
      "role": "trainer",
      "full_name": "John Applicant",
      "user_name": "johnapplicant",
      "email": "john@example.com",
      "phone_number": "+1234567890",
      "location": "New York, NY",
      "bio": null,
      "specialties": [],
      "reason_for_joining": "I am a certified personal trainer with NASM certification and 5 years of experience. I specialize in weight loss and strength training for beginners...",
      "created_at": "2025-11-13T08:00:00.000Z",
      "is_verified": false
    }
  ],
  "nutritionists": [],
  "total": 1,
  "timestamp": "2025-11-13T10:30:00.000Z"
}
```

**Error Responses:**

- `401` - Not authenticated
- `403` - Not an admin
- `500` - Server error

**Notes:**

- Only returns professionals with `is_verified: false` and non-null `reason_for_joining`
- Professionals without `reason_for_joining` are from before this feature was added

---

### POST /api/admin/manage-professional

Approve or reject a professional application.

**Auth Required:** Yes (Admin role)

**Request Body:**

```json
{
  "userId": "uuid",
  "role": "trainer | nutritionist",
  "action": "approve | reject"
}
```

**Success Response (200):**

For approval:

```json
{
  "message": "Professional approved successfully",
  "userId": "uuid",
  "role": "trainer",
  "action": "approved"
}
```

For rejection:

```json
{
  "message": "Professional rejected and account deleted",
  "userId": "uuid",
  "role": "trainer",
  "action": "rejected"
}
```

**Error Responses:**

- `400` - Missing required fields or invalid values
- `401` - Not authenticated
- `403` - Not an admin
- `500` - Server error

**Behavior:**

- **Approve**: Sets `is_verified: true` in professional profile
- **Reject**: Deletes profile → deletes user record → deletes auth account (permanent)

**Notes:**

- Confirmation dialogs shown in UI before action
- Approval allows professional to complete onboarding and be matched
- Rejection completely removes account from system

---

## Error Handling

All API endpoints return consistent error responses:

```json
{
  "error": "Human-readable error message"
}
```

### HTTP Status Codes

- `200` - Success
- `201` - Created (signup)
- `400` - Bad Request (validation error, missing fields)
- `401` - Unauthorized (not authenticated)
- `403` - Forbidden (insufficient permissions, wrong role)
- `404` - Not Found (resource doesn't exist, profile incomplete)
- `500` - Internal Server Error

### Common Error Scenarios

**Profile Not Complete:**

```json
{
  "error": "Profile not found. Please complete your profile first."
}
```

→ Client should redirect to `/auth/complete-profile`

**Wrong Role:**

```json
{
  "error": "This endpoint is only available for clients"
}
```

**Not Verified (Professional):**

```json
{
  "error": "Your account is pending admin verification"
}
```

**AI Service Error:**

```json
{
  "error": "NVIDIA API key not configured"
}
```

---

## Environment Setup

### Required Environment Variables

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# NVIDIA AI (for embeddings and LLM)
NVIDIA_API_KEY=your_nvidia_api_key
```

### Variable Usage

**Client-Side (NEXT*PUBLIC*\*):**

- `NEXT_PUBLIC_SUPABASE_URL` - Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Public anon key (safe for browser)

**Server-Side Only:**

- `SUPABASE_SERVICE_ROLE_KEY` - Bypasses RLS (NEVER expose to client)
- `NVIDIA_API_KEY` - NVIDIA API access for embeddings and LLM

### First-Time Setup

1. **Configure Environment Variables**
2. **Run Database Migrations** (add columns, indexes, functions)
3. **Create Admin User** (manually set role to 'admin' in database)
4. **Verify Professionals** (use admin dashboard or SQL)
5. **Generate Initial Embeddings** (via admin dashboard or API)
6. **Test Matching** (as authenticated client)

---

## Complete User Flows

### Client Registration & Matching

1. **Sign Up**: `POST /api/auth/signup`
2. **Confirm Email**: Click link in email
3. **Sign In**: `POST /api/auth/login`
4. **Complete Profile**: `POST /api/auth/complete-profile` (role: "client")
5. **Dashboard**: `GET /api/me` → redirect to onboarding if needed
6. **Onboarding**: `POST /api/me/onboarding`
7. **Get AI Recommendations**: `GET /api/me/match` (suggestions only, not saved)
8. **Review Matches**: View AI reasoning and professional profiles
9. **Save Selection**:
   - Option A: Accept AI suggestions → `PUT /api/me/match/update` with AI-provided user IDs
   - Option B: Browse all professionals → `GET /api/professionals` → `PUT /api/me/match/update` with chosen IDs
10. **View Current Matches**: `GET /api/me/match/current`
11. **Change Matches**: Call `GET /api/me/match` again for new suggestions OR `PUT /api/me/match/update` to manually change
12. **View Professional Details**: `GET /api/professionals/[username]`

### Professional Registration & Approval

1. **Sign Up**: `POST /api/auth/signup`
2. **Confirm Email**: Click link in email
3. **Sign In**: `POST /api/auth/login`
4. **Complete Profile**: `POST /api/auth/complete-profile` (role: "trainer", with reasonForJoining)
5. **Wait for Approval**: Account in pending state (`is_verified: false`)
6. **Admin Reviews**: Admin sees application in dashboard
7. **Admin Approves**: `POST /api/admin/manage-professional` (action: "approve")
8. **Professional Notified**: Can now complete onboarding
9. **Complete Onboarding**: `PUT /api/professionals/onboarding` (bio + specialties)
10. **Embedding Generated**: Automatic via webhook
11. **Now Matchable**: Appears in client matches

### Admin Workflow

1. **Sign In**: `POST /api/auth/login` (admin account)
2. **Access Dashboard**: `GET /api/admin/verify`
3. **View Stats**: `GET /api/admin/stats`
4. **Review Applications**: `GET /api/admin/pending-professionals`
5. **Approve/Reject**: `POST /api/admin/manage-professional`
6. **Generate Embeddings**: `POST /api/admin/generate-embeddings` (if needed)

---

## API Testing

### Using cURL

**Sign Up:**

```bash
curl -X POST http://localhost:3000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"test123"}'
```

**Sign In (Save Cookies):**

```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -c cookies.txt \
  -d '{"email":"test@example.com","password":"test123"}'
```

**Complete Profile:**

```bash
curl -X POST http://localhost:3000/api/auth/complete-profile \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '{
    "role":"client",
    "fullName":"Test User",
    "userName":"testuser",
    "location":"Austin, TX"
  }'
```

**Get Profile:**

```bash
curl -X GET http://localhost:3000/api/me \
  -b cookies.txt
```

**Get AI Match Suggestions:**

```bash
curl -X GET http://localhost:3000/api/me/match \
  -b cookies.txt
```

**Get Current Saved Matches:**

```bash
curl -X GET http://localhost:3000/api/me/match/current \
  -b cookies.txt
```

**Save Match Selection:**

```bash
curl -X PUT http://localhost:3000/api/me/match/update \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '{
    "trainerId":"trainer-uuid",
    "nutritionistId":"nutritionist-uuid"
  }'
```

### Using JavaScript/TypeScript

```typescript
// Sign In
const response = await fetch("/api/auth/login", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  credentials: "include",
  body: JSON.stringify({
    email: "user@example.com",
    password: "password123",
  }),
});

// Get Profile
const profile = await fetch("/api/me", {
  credentials: "include",
});

// Get AI Match Suggestions (not saved)
const aiSuggestions = await fetch("/api/me/match", {
  credentials: "include",
});
const { matches } = await aiSuggestions.json();

// Save the AI suggestions (or any professional IDs)
const saveResponse = await fetch("/api/me/match/update", {
  method: "PUT",
  headers: { "Content-Type": "application/json" },
  credentials: "include",
  body: JSON.stringify({
    trainerId: matches.trainer.user_id,
    nutritionistId: matches.nutritionist.user_id,
  }),
});

// Get currently saved matches
const currentMatches = await fetch("/api/me/match/current", {
  credentials: "include",
});
```

---

## Rate Limiting & Performance

**AI Matching:**

- Average response time: 2-4 seconds
- Vector search: ~100-200ms
- LLM reasoning: ~2-3 seconds
- Not cached (personalized per request)

**Embedding Generation:**

- Bulk operations: ~100ms per professional
- Webhook triggers: Near real-time
- Automatic retry with exponential backoff

**Database Queries:**

- Most endpoints: <100ms
- Vector search: <200ms with HNSW index

---

## Security Notes

1. **Never expose** `SUPABASE_SERVICE_ROLE_KEY` to client
2. **Always use** server-side validation for protected routes
3. **Admin routes** protected with middleware + role check
4. **Passwords** never stored or logged
5. **Sessions** managed via HTTP-only cookies
6. **RLS policies** enforced at database level
7. **Professional approval** required before public visibility

---

**Last Updated:** November 13, 2025
**API Version:** 1.0
**Next.js Version:** 16.0+
