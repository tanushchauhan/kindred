# API Routes Documentation

Complete API reference for the wellness platform using Next.js App Router and Supabase.

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
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
```

**Note:**

- `NEXT_PUBLIC_*` variables are exposed to the browser
- `SUPABASE_SERVICE_ROLE_KEY` is server-side only (never expose to client)
- Service role key bypasses RLS policies (use with caution)

---

## Database Requirements

### Users Table

Must have `user_name` column with UNIQUE constraint:

```sql
ALTER TABLE users ADD COLUMN user_name text UNIQUE;
```

### Professional Verification

Set `is_verified = true` in `trainer_profiles` or `nutritionist_profiles` table to allow onboarding.
