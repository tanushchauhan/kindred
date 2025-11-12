# API Routes Documentation

Complete API reference for Kindred using Next.js App Router and Supabase.

## Authentication

Protected routes use server-side session validation via cookies. Include credentials in all authenticated requests.

---

## Authentication Endpoints

### POST /api/auth/signup

Register a new user. Email confirmation required.

**Request:**

```json
{
  "email": "user@example.com",
  "password": "securePassword123"
}
```

**Success (201):**

```json
{
  "user": { "id": "uuid", "email": "user@example.com" },
  "message": "Check your email to confirm account",
  "emailConfirmationRequired": true
}
```

**Errors:** 400, 500

---

### POST /api/auth/login

Authenticate a user.

**Request:**

```json
{
  "email": "user@example.com",
  "password": "securePassword123"
}
```

**Success (200):**

```json
{
  "session": { "access_token": "...", "refresh_token": "..." },
  "user": { "id": "uuid", "email": "user@example.com" },
  "message": "Login successful"
}
```

**Errors:** 400, 401, 500

---

### POST /api/auth/logout

Sign out the current user.

**Auth Required:** Yes

**Success (200):**

```json
{
  "message": "Logout successful"
}
```

---

### GET /api/auth/user

Get authenticated user's email.

**Auth Required:** Yes

**Success (200):**

```json
{
  "email": "user@example.com"
}
```

**Errors:** 401

---

### DELETE /api/auth/delete-account

Permanently delete user account and all data.

**Auth Required:** Yes

**Success (200):**

```json
{
  "message": "Account deleted successfully"
}
```

**Errors:** 401, 500

---

## Profile Management

### POST /api/auth/complete-profile

Complete user profile after email confirmation. Creates database records.

**Auth Required:** Yes

**Request:**

```json
{
  "role": "client | trainer | nutritionist",
  "fullName": "John Doe",
  "userName": "johndoe",
  "phoneNumber": "+1234567890",
  "gender": "male | female | other",
  "location": "New York, NY",
  "birthDate": "1990-01-15"
}
```

**Required:** `role`, `fullName`, `userName`

**Username Requirements:**

- Unique
- Minimum 3 characters
- Only letters, numbers, hyphens, underscores
- Format: `/^[a-zA-Z0-9_-]+$/`

**Success (200):**

```json
{
  "message": "Profile completed successfully",
  "user": {
    "id": "uuid",
    "role": "client",
    "full_name": "John Doe",
    "user_name": "johndoe"
  }
}
```

**Errors:** 400 (username taken/invalid), 401, 500

---

### GET /api/auth/complete-profile

Check if profile needs completion.

**Auth Required:** Yes

**Success (200):**

```json
{
  "profileCompleted": true | false,
  "user": { ... } // if completed
}
```

**Errors:** 401, 500

---

### GET /api/check-username

Check username availability in real-time.

**Query Params:** `username`

**Success (200):**

```json
{
  "available": true | false
}
```

**Errors:** 400

---

### GET /api/me

Get complete user profile with role-specific data.

**Auth Required:** Yes

**Success (200):**

```json
{
  "id": "uuid",
  "email": "user@example.com",
  "user_name": "johndoe",
  "role": "client",
  "full_name": "John Doe",
  "phone_number": "+1234567890",
  "gender": "male",
  "location": "New York, NY",
  "birth_date": "1990-01-15",
  "client_profiles": [...] // or trainer_profiles/nutritionist_profiles
}
```

**Errors:** 401, 404 (profile incomplete - redirect to complete-profile), 500

---

### PUT /api/profile/update

Update user profile information. Available to all roles.

**Auth Required:** Yes

**Request:**

```json
{
  "full_name": "John Doe",
  "phone_number": "+1234567890",
  "gender": "male | female | other",
  "location": "New York, NY",
  "birth_date": "1990-01-15"
}
```

**Required:** `full_name`

**Success (200):**

```json
{
  "message": "Profile updated successfully",
  "profile": { ... }
}
```

**Errors:** 400, 401, 500

---

## Client Onboarding

### POST /api/me/onboarding

Save onboarding questionnaire data (clients only).

**Auth Required:** Yes (clients only)

**Request:**

```json
{
  "goals": ["weight_loss"],
  "fitness_level": "beginner",
  "dietary_preferences": ["vegetarian"]
}
```

**Success (200):**

```json
{
  "message": "Onboarding data saved successfully",
  "data": { ... }
}
```

**Errors:** 400, 401, 403, 500

---

## Professional Features

### GET /api/professionals/onboarding

Get professional's onboarding status and profile.

**Auth Required:** Yes (trainers/nutritionists only)

**Success (200):**

```json
{
  "role": "trainer",
  "profile": {
    "bio": "Experienced trainer...",
    "specialties": ["Weight Loss", "HIIT"],
    "is_verified": true
  },
  "isVerified": true,
  "hasCompletedOnboarding": true
}
```

**Errors:** 401, 403, 404

---

### PUT /api/professionals/onboarding

Update professional profile with bio and specialties.

**Auth Required:** Yes (verified trainers/nutritionists only)

**Request:**

```json
{
  "bio": "Experienced trainer specializing in...",
  "specialties": ["Weight Loss", "Strength Training", "Custom Specialty"]
}
```

**Required:** `bio` (non-empty), at least one specialty

**Success (200):**

```json
{
  "message": "Professional onboarding completed successfully",
  "profile": { ... }
}
```

**Errors:** 400, 401, 403 (not verified), 404, 500

---

## Public Professional Directory

### GET /api/professionals

List all verified trainers and nutritionists with complete profiles.

**Auth Required:** No (public)

**Success (200):**

```json
{
  "trainers": [
    {
      "id": "uuid",
      "full_name": "John Doe",
      "user_name": "johndoe",
      "location": "Austin, TX",
      "trainer_profiles": {
        "bio": "Experienced trainer...",
        "specialties": ["Weight Loss", "HIIT"],
        "is_verified": true
      }
    }
  ],
  "nutritionists": [...]
}
```

**Filters:** Only verified professionals with bio and username set.

**Errors:** 500

---

### GET /api/professionals/[username]

Get individual professional profile by username.

**Auth Required:** No (public)

**Success (200):**

```json
{
  "id": "uuid",
  "role": "trainer",
  "full_name": "John Doe",
  "user_name": "johndoe",
  "location": "Austin, TX",
  "profile": {
    "bio": "Experienced trainer...",
    "specialties": ["Weight Loss", "HIIT"],
    "is_verified": true
  }
}
```

**Errors:** 404 (not found/not verified/incomplete profile), 500

---

## Complete Registration Flow

### 1. Signup

```bash
curl -X POST http://localhost:3000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"pass123"}'
```

### 2. Confirm Email

Click link in email (Supabase handles this).

### 3. Login (Save Cookies)

```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -c cookies.txt \
  -d '{"email":"user@example.com","password":"pass123"}'
```

### 4. Complete Profile

```bash
curl -X POST http://localhost:3000/api/auth/complete-profile \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '{
    "role":"client",
    "fullName":"John Doe",
    "userName":"johndoe",
    "location":"New York, NY"
  }'
```

### 5. Access Protected Routes

```bash
curl -X GET http://localhost:3000/api/me -b cookies.txt
```

---

## Professional Specialties

### Trainer Specialties (22)

Weight Loss, Muscle Building, Strength Training, Cardiovascular Training, HIIT, CrossFit, Powerlifting, Olympic Weightlifting, Bodybuilding, Functional Training, Sports-Specific Training, Injury Rehabilitation, Pre/Postnatal Fitness, Senior Fitness, Youth Fitness, Flexibility & Mobility, Yoga, Pilates, Boxing & Martial Arts, Running & Marathon Training, Calisthenics, TRX/Suspension Training

### Nutritionist Specialties (22)

Weight Management, Sports Nutrition, Clinical Nutrition, Pediatric Nutrition, Geriatric Nutrition, Prenatal/Postnatal Nutrition, Diabetes Management, Heart Health, Digestive Health, Food Allergies & Intolerances, Plant-Based/Vegan Nutrition, Ketogenic Diet, Mediterranean Diet, Eating Disorders, Autoimmune Conditions, Hormone Balance, Mental Health & Nutrition, Meal Planning, Supplement Guidance, Metabolic Health, Renal Nutrition, Oncology Nutrition

Custom specialties are also supported.

---

## AI-Powered Matching

### POST /api/admin/generate-embeddings

**[ADMIN ONLY]** Bulk generate embeddings for all professionals. Run once after setup or when adding many professionals.

**Auth Required:** Yes (Admin Secret Key)

**Headers:**

```json
{
  "Authorization": "Bearer YOUR_ADMIN_SECRET_KEY"
}
```

**Query Params:**

- `type`: `"trainers" | "nutritionists" | "all"` (default: `"all"`)

**Example Request:**

```bash
curl -X POST 'http://localhost:3000/api/admin/generate-embeddings?type=all' \
  -H "Authorization: Bearer your_admin_secret_key"
```

**Success (200):**

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
      "success": 12,
      "failed": 0,
      "errors": []
    }
  },
  "timestamp": "2025-11-05T10:30:00.000Z"
}
```

**Errors:**

- `401` - Invalid or missing admin key
- `500` - GEMINI_API_KEY not configured or API error

**Notes:**

- Processes only verified professionals with bios
- Updates `embedding` column in profile tables
- Uses Google Gemini embedding-001 model (768 dimensions recommended)
- Includes 100ms delay between requests to avoid rate limiting
- Can be safely re-run to update embeddings

---

### GET /api/me/match

**[CLIENTS ONLY]** Get AI-powered matches - the best trainer and nutritionist for your needs.

**Auth Required:** Yes (Client role only)

**Two-Stage Matching Process:**

1. **Semantic Retrieval**: Fast vector similarity search retrieves top 10 candidates per role
2. **LLM Ranking**: Gemini 2.5 Pro analyzes all candidates and selects the single best match with reasoning

**Success (200):**

```json
{
  "matches": {
    "trainer": {
      "user_id": "uuid",
      "full_name": "John Doe",
      "bio": "Experienced trainer specializing in...",
      "specialties": ["Weight Loss", "HIIT", "Strength Training"],
      "reasoning": "John is an excellent match because your goal of losing 30 pounds aligns perfectly with his specialty in weight loss and HIIT training. His experience with beginners will ensure you receive proper guidance."
    },
    "nutritionist": {
      "user_id": "uuid",
      "full_name": "Jane Smith",
      "bio": "Registered dietitian with focus on...",
      "specialties": ["Weight Management", "Plant-Based Nutrition"],
      "reasoning": "Jane specializes in weight management and plant-based nutrition, which directly aligns with your vegetarian dietary preferences and weight loss goals."
    }
  },
  "metadata": {
    "query_timestamp": "2025-11-05T10:30:00.000Z",
    "candidates_retrieved": {
      "trainers": 10,
      "nutritionists": 10
    },
    "processing_time_ms": 3421
  }
}
```

**Errors:**

- `400` - No onboarding data (complete wellness profile first)
- `401` - Not authenticated
- `403` - Not a client (feature only for clients)
- `404` - No matching professionals found
- `500` - AI service not configured or API error

**Requirements:**

- Client must have completed onboarding (saved onboarding_data)
- At least one verified trainer and nutritionist with embeddings
- GEMINI_API_KEY must be configured

**Performance:**

- Average processing time: 2-4 seconds
- Vector search: ~100-200ms
- LLM reasoning: ~2-3 seconds
- Results are personalized and not cached

---

## AI Matching Setup

### Required Environment Variables

```env
# Google Gemini API (for embeddings and LLM)
GEMINI_API_KEY=your_gemini_api_key

# Admin secret for bulk operations
ADMIN_SECRET_KEY=your_secure_random_string
```

### Database Configuration

The AI matching feature requires:

1. **pgvector extension** enabled in Supabase
2. **embedding columns** added to professional profile tables
3. **Vector similarity search functions** created

See **[INSTRUCTIONS.md](./INSTRUCTIONS.md)** for complete SQL setup.

### First-Time Setup Flow

1. **Configure Database**

```sql
-- Enable pgvector
CREATE EXTENSION IF NOT EXISTS vector;

-- Add embedding columns
ALTER TABLE trainer_profiles ADD COLUMN embedding vector(768);
ALTER TABLE nutritionist_profiles ADD COLUMN embedding vector(768);

-- Create search functions
-- (See INSTRUCTIONS.md for complete SQL)
```

2. **Set Environment Variables**

```bash
GEMINI_API_KEY=your_key_here
ADMIN_SECRET_KEY=generate_secure_random_string
```

3. **Generate Initial Embeddings**

```bash
curl -X POST 'http://localhost:3000/api/admin/generate-embeddings?type=all' \
  -H "Authorization: Bearer your_admin_secret_key"
```

4. **Test Matching**

```bash
# As authenticated client
curl -X GET 'http://localhost:3000/api/me/match' \
  -b cookies.txt
```

### Automated Updates

For automatic embedding generation when professionals update profiles:

- Use Supabase Database Triggers + Edge Functions
- See **[INSTRUCTIONS.md](./INSTRUCTIONS.md)** Section C for implementation

---

## Error Handling

All endpoints return consistent error format:

```json
{
  "error": "Error message"
}
```

**Common Status Codes:**

- `200` - Success
- `201` - Created
- `400` - Bad Request (validation error)
- `401` - Unauthorized (not logged in)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found
- `500` - Internal Server Error

---

## Key Features

### Username System

- Required during profile completion
- Unique constraint enforced
- Real-time availability checking
- Used for professional profile URLs (`/professionals/username`)

### Professional Visibility

Shows in directory only if:

- `is_verified = true`
- Bio is not null
- Username is set
- Profile complete

### Auto-Redirects

- Dashboard checks profile completion → redirects to complete-profile if needed
- Complete-profile checks authentication → redirects if already done
- Sign-in/Sign-up pages redirect authenticated users to dashboard

---

## Environment Variables

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# Google Gemini AI (for matching feature)
GEMINI_API_KEY=your_gemini_api_key

# Admin access (for bulk operations)
ADMIN_SECRET_KEY=your_secure_random_string
```

**Note:**

- `NEXT_PUBLIC_*` variables are exposed to the browser
- `SUPABASE_SERVICE_ROLE_KEY` is server-side only (never expose to client)
- Service role key bypasses RLS policies (use with caution)
- `GEMINI_API_KEY` is server-side only (for AI matching)
- `ADMIN_SECRET_KEY` should be a long, random string (for admin endpoints)

---

## Database Requirements

### Users Table

Must have `user_name` column with UNIQUE constraint:

```sql
ALTER TABLE users ADD COLUMN user_name text UNIQUE;
```

### Professional Verification

Set `is_verified = true` in `trainer_profiles` or `nutritionist_profiles` table to allow onboarding.

### AI Matching Requirements

For the matching feature to work:

1. **Database**: pgvector extension enabled with embedding columns
2. **Embeddings**: Run `/api/admin/generate-embeddings` after adding professionals
3. **Professional Data**: Must have `is_verified = true`, non-null `bio`, and embeddings
4. **Client Data**: Must have completed onboarding with `onboarding_data`

See **[INSTRUCTIONS.md](./INSTRUCTIONS.md)** for complete setup guide.
