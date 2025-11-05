# Professional Directory Feature

## Overview

Added a public directory for verified trainers and nutritionists with username-based profiles. Users can browse professionals and view their bios and specialties without authentication.

## Database Changes

### Added Column to `users` table:

```sql
ALTER TABLE public.users
ADD COLUMN user_name text UNIQUE;
```

**Note**: The `user_name` column must have a UNIQUE constraint.

## New Features

### 1. Username System

- **Required during profile completion**
- **Unique constraint** - checked before insertion
- **Format validation**: Only letters, numbers, hyphens, and underscores (minimum 3 characters)
- **Real-time availability checking** during registration
- **URL-friendly** for professional profile pages

### 2. Public Professional Directory (`/professionals`)

- Browse all verified trainers and nutritionists
- Tab-based interface (Trainers | Nutritionists)
- Card display showing:
  - Full name and username
  - Location
  - Bio preview (3 lines)
  - First 3 specialties
  - Verified badge
- Click to view full profile
- **No authentication required**

### 3. Individual Professional Profiles (`/professionals/[username]`)

- Accessible via username slug
- Shows complete professional information:
  - Full name and username
  - Verification status
  - Location
  - Full bio
  - All specialties
  - CTA buttons (Sign Up / Sign In)
- **Public access** - no authentication required
- 404 for non-existent or unverified professionals

## API Endpoints

### POST /api/auth/complete-profile

**Updated** to require `userName` field

**Request Body**:

```json
{
  "role": "trainer | nutritionist | client",
  "fullName": "John Doe",
  "userName": "johndoe",
  "phoneNumber": "1234567890",
  "gender": "male",
  "location": "Austin, TX",
  "birthDate": "1990-01-01"
}
```

**Validation**:

- `userName` is required
- Must be unique (checked against database)
- Format: `/^[a-zA-Z0-9_-]+$/` (alphanumeric, hyphens, underscores)
- Minimum 3 characters

**Error Responses**:

- `400`: "Username is already taken. Please choose a different one."
- `400`: "Invalid username format. Only letters, numbers, hyphens, and underscores are allowed"

### GET /api/check-username?username={username}

**New endpoint** for real-time username availability checking

**Query Parameters**:

- `username`: The username to check

**Response**:

```json
{
  "available": true | false
}
```

**Usage**: Called on blur/change of username input field

### GET /api/professionals

**New endpoint** to fetch all verified professionals

**Authentication**: Not required (public)

**Response**:

```json
{
  "trainers": [
    {
      "id": "uuid",
      "full_name": "John Doe",
      "user_name": "johndoe",
      "location": "Austin, TX",
      "trainer_profiles": {
        "bio": "...",
        "specialties": ["Weight Loss", "Strength Training"],
        "is_verified": true
      }
    }
  ],
  "nutritionists": [...]
}
```

**Filters Applied**:

- Only verified professionals (`is_verified = true`)
- Only those with completed profiles (bio is not null)
- Ordered by `full_name`

### GET /api/professionals/[username]

**New endpoint** to fetch individual professional by username

**Authentication**: Not required (public)

**Response**:

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

**Error Responses**:

- `404`: Professional not found
- `404`: Professional profile not found or not verified
- `404`: User is not a professional
- `404`: Professional profile is not complete

## UI Updates

### 1. Complete Profile Page (`/auth/complete-profile`)

**Added**:

- Username input field (required)
- Real-time availability checking
- Format validation feedback
- Visual indicators (✓ Available / ✗ Taken/Invalid)
- Helper text showing format requirements

### 2. Home Page (`/`)

**Added**:

- "Find Professionals" card with gradient styling
- Links to `/professionals` directory
- Prominent placement between auth cards and API info

### 3. New Pages

#### `/professionals`

- Tab navigation (Trainers / Nutritionists)
- Professional count badges
- Grid layout (3 columns on desktop)
- Professional cards with:
  - Name, username, location
  - Bio preview
  - Specialty tags (max 3 shown)
  - "+N more" indicator
  - Verified badge
- Empty states for no professionals
- Back to Home link

#### `/professionals/[username]`

- Full professional profile view
- Detailed bio display (with line breaks preserved)
- All specialty tags displayed
- Verification badge
- Location information
- CTA section with Sign Up / Sign In buttons
- Back to Professionals link
- 404 handling

## Data Requirements

### For Professionals to Appear in Directory:

1. `is_verified = true` in role-specific table
2. `bio` field must not be null
3. Profile must be complete (onboarding done)
4. `user_name` must be set

### Profile Visibility Logic:

```
Show in directory IF:
  - role IN ('trainer', 'nutritionist') AND
  - is_verified = true AND
  - bio IS NOT NULL AND
  - user_name IS NOT NULL
```

## Files Created/Modified

### Created:

- `app/api/check-username/route.ts` - Username availability API
- `app/api/professionals/route.ts` - List all professionals API
- `app/api/professionals/[username]/route.ts` - Single professional API
- `app/professionals/page.tsx` - Directory page
- `app/professionals/[username]/page.tsx` - Individual profile page

### Modified:

- `lib/types.ts` - Added `user_name` to User interface
- `app/api/auth/complete-profile/route.ts` - Added username validation and uniqueness check
- `app/auth/complete-profile/page.tsx` - Added username field with validation
- `app/page.tsx` - Added "Find Professionals" link

## Testing

### 1. Username Validation

```bash
# Test unique username check
curl http://localhost:3000/api/check-username?username=johndoe

# Should return {"available": true} or {"available": false}
```

### 2. Complete Profile with Username

```bash
curl -X POST http://localhost:3000/api/auth/complete-profile \
  -H "Content-Type: application/json" \
  -d '{
    "role": "trainer",
    "fullName": "John Doe",
    "userName": "johndoe",
    "location": "Austin, TX"
  }'
```

### 3. Fetch Professionals

```bash
# Get all professionals
curl http://localhost:3000/api/professionals

# Get specific professional
curl http://localhost:3000/api/professionals/johndoe
```

### 4. Manual Verification (for testing)

```sql
-- Verify a trainer
UPDATE trainer_profiles
SET is_verified = true
WHERE user_id = 'uuid-here';

-- Add bio and specialties
UPDATE trainer_profiles
SET
  bio = 'Experienced trainer specializing in weight loss and strength training',
  specialties = ARRAY['Weight Loss', 'Strength Training', 'HIIT']
WHERE user_id = 'uuid-here';
```

## Security Considerations

1. ✅ Username uniqueness enforced at database and API level
2. ✅ Format validation prevents injection attacks
3. ✅ Public endpoints only expose verified, complete profiles
4. ✅ User IDs not exposed in public URLs (usernames used instead)
5. ✅ No sensitive information exposed in public profiles
6. ✅ Only shows professionals who have completed onboarding

## Future Enhancements

- Search/filter by specialty or location
- Professional ratings and reviews
- Direct messaging system
- Booking/scheduling integration
- Professional availability calendar
- Profile photos/avatars
- Certifications display
- Years of experience
- Client testimonials
- Social media links
