# API Routes Documentation

Core user authentication and onboarding API routes for the wellness platform using Next.js App Router and Supabase.

## Authentication

Protected routes (`/api/me/*`) use server-side session validation via cookies.

## Endpoints

### POST /api/auth/signup

Registers a new user in Supabase Auth. Creates auth account only.

**Important:** After signup, users must:

1. Confirm their email via the link sent to them
2. Call `POST /api/auth/complete-profile` with their profile data to create database records

**Request:**

```json
{
  "email": "user@example.com",
  "password": "securePassword123"
}
```

**Required Fields:** `email`, `password`

**Success (201):**

```json
{
  "user": { "id": "uuid", "email": "user@example.com" },
  "message": "Please check your email to confirm your account. After confirmation, complete your profile at /api/auth/complete-profile",
  "emailConfirmationRequired": true
}
```

**Errors:** 400 (validation), 500 (server error)

---

### POST /api/auth/complete-profile

Completes user profile after email confirmation. Creates records in database tables.

**Auth Required:** Yes (must be logged in after email confirmation)

**Request:**

```json
{
  "role": "client",
  "fullName": "John Doe",
  "phoneNumber": "+1234567890",
  "gender": "male",
  "location": "New York, NY",
  "birthDate": "1990-01-15"
}
```

**Required Fields:** `role`, `fullName`

**Optional Fields:** `phoneNumber`, `gender`, `location`, `birthDate`

**Success (200):**

```json
{
  "message": "Profile completed successfully",
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "role": "client",
    "full_name": "John Doe"
  }
}
```

**Errors:** 400 (already completed / missing data), 401 (unauthorized), 500 (server error)

---

### GET /api/auth/complete-profile

Checks if the authenticated user needs to complete their profile.

**Auth Required:** Yes

**Success (200) - Profile Completed:**

```json
{
  "profileCompleted": true,
  "user": { "id": "uuid", "role": "client", "full_name": "John Doe" }
}
```

**Success (200) - Profile Incomplete:**

```json
{
  "profileCompleted": false,
  "message": "Please complete your profile by calling POST /api/auth/complete-profile with role and fullName"
}
```

**Errors:** 401 (unauthorized), 500 (server error)

---

### POST /api/auth/login

Authenticates a user.

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
  "session": { "access_token": "jwt_token", "refresh_token": "..." },
  "user": { "id": "uuid", "email": "user@example.com" },
  "message": "Login successful"
}
```

**Errors:** 400 (validation), 401 (invalid credentials), 500 (server error)

---

### GET /api/me

Fetches the authenticated user's complete profile with role-specific data.

**Auth Required:** Yes

**Success (200):**

```json
{
  "id": "uuid",
  "role": "client",
  "full_name": "John Doe",
  "phone_number": "+1234567890",
  "gender": "male",
  "location": "New York, NY",
  "birth_date": "1990-01-15",
  "client_profiles": [{ "user_id": "uuid", "onboarding_data": {...} }]
}
```

**Errors:** 401 (unauthorized), 404 (not found), 500 (server error)

---

### POST /api/me/onboarding

Saves onboarding questionnaire data for clients only.

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
  "data": { "goals": ["weight_loss"], ... }
}
```

**Errors:** 400 (validation), 401 (unauthorized), 403 (not a client), 500 (server error)

---

## Environment Variables

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## Complete Registration Flow

The registration process requires two steps due to email confirmation:

### Step 1: Signup

User submits registration form with email and password only.

```bash
curl -X POST http://localhost:3000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "email":"user@example.com",
    "password":"securePass123"
  }'
```

    "role":"client",

````

**Response:**

```json
{
  "user": { "id": "uuid", "email": "user@example.com" },
  "message": "Please check your email to confirm your account...",
  "emailConfirmationRequired": true
}
````

### Step 2: Email Confirmation

User clicks confirmation link in email (handled by Supabase automatically).

### Step 3: Login

After confirmation, user logs in. **Important: Save cookies for authentication!**

```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -c cookies.txt \
  -d '{
    "email":"user@example.com",
    "password":"securePass123"
  }'
```

**Note:** The `-c cookies.txt` flag saves session cookies to a file for subsequent requests.

### Step 4: Check Profile Status

Check if profile needs completion. **Use saved cookies:**

```bash
curl -X GET http://localhost:3000/api/auth/complete-profile \
  -b cookies.txt
```

**Note:** The `-b cookies.txt` flag sends the saved session cookies for authentication.

**If incomplete:**

```json
{
  "profileCompleted": false,
  "message": "Please complete your profile by calling POST /api/auth/complete-profile with role and fullName"
}
```

### Step 5: Complete Profile

Create database records with profile data. **Must include cookies:**

```bash
curl -X POST http://localhost:3000/api/auth/complete-profile \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '{
    "role":"client",
    "fullName":"John Doe",
    "phoneNumber":"+1234567890",
    "gender":"male",
    "location":"New York, NY",
    "birthDate":"1990-01-15"
  }'
```

**Note:** The `-b cookies.txt` flag is required to send authentication cookies.

**Success:**

```json
{
  "message": "Profile completed successfully",
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "role": "client",
    "full_name": "John Doe"
  }
}
```

### Step 6: Access Profile

Now user can access protected endpoints:

```bash
curl -X GET http://localhost:3000/api/me \
  -b cookies.txt
```

---

## Testing Examples

**Quick Test (with email confirmation disabled):**

```bash
# 1. Signup
curl -X POST http://localhost:3000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"pass123","role":"client","fullName":"Test User"}'

# 2. Login (saves cookies)
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -c cookies.txt \
  -d '{"email":"test@example.com","password":"pass123"}'

# 3. Complete profile
curl -X POST http://localhost:3000/api/auth/complete-profile \
  -b cookies.txt

# 4. Get profile
curl -X GET http://localhost:3000/api/me \
  -b cookies.txt

# 5. Save onboarding data
curl -X POST http://localhost:3000/api/me/onboarding \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '{"goals":["weight_loss"],"fitness_level":"beginner"}'
```

**Note:** To disable email confirmation for testing:

- Go to Supabase Dashboard → Authentication → Email Auth
- Uncheck "Enable email confirmations"
- Re-enable in production!

---

## Error Handling

All endpoints follow consistent error response format:

```json
{
  "error": "Error message description"
}
```

Common HTTP status codes:

- `200` - Success
- `201` - Created (signup)
- `400` - Bad Request (validation error)
- `401` - Unauthorized (not logged in)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found
- `500` - Internal Server Error

---

## Troubleshooting

### "User profile not found" (404) on GET /api/me

**Cause:** User exists in auth but not in database tables.

**Solution:** Call `POST /api/auth/complete-profile` to create database records.

### "Unauthorized" (401) on /api/auth/complete-profile

**Cause:** User hasn't confirmed email, isn't logged in, or **cookies weren't passed**.

**Solution:**

1. Check email for confirmation link
2. Click confirmation link
3. Login via `POST /api/auth/login` **with `-c cookies.txt`** to save cookies
4. Retry profile completion **with `-b cookies.txt`** to send cookies

**Common mistake:** Forgetting to use `-c` on login or `-b` on subsequent requests.

**Example of correct flow:**

```bash
# Login and SAVE cookies
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -c cookies.txt \
  -d '{"email":"user@example.com","password":"pass123"}'

# Complete profile and SEND cookies
curl -X POST http://localhost:3000/api/auth/complete-profile \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '{"role":"client","fullName":"John Doe"}'
```

### "Profile already completed" (400) on POST /api/auth/complete-profile

**Cause:** Database records already exist for this user.

**Solution:** This is expected. User can proceed to use the app normally.

### Email confirmation not received

**Solutions:**

1. Check spam folder
2. Wait a few minutes (email delivery can be delayed)
3. For development: Disable email confirmation in Supabase Dashboard
4. Check Supabase logs for email delivery errors

### RLS policy errors (42501)

**Cause:** Missing INSERT policies on database tables.

**Solution:** Run the INSERT policies from `DATABASE_INSERT_POLICIES.sql`:

```sql
-- Allow users to insert their own records
CREATE POLICY "Users can insert own record"
ON users FOR INSERT
WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can insert own client profile"
ON client_profiles FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can insert own trainer profile"
ON trainer_profiles FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can insert own nutritionist profile"
ON nutritionist_profiles FOR INSERT
WITH CHECK (auth.uid() = user_id);
```

---

## Additional Resources

- **REGISTRATION_FLOW.md** - Detailed registration flow explanation
- **DATABASE_INSERT_POLICIES.sql** - RLS policies for database
- **FIX_TEST_USER.sql** - Manual user profile creation script

For more details on the two-step registration approach, see `REGISTRATION_FLOW.md`.
