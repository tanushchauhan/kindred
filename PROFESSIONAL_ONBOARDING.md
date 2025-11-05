# Professional Onboarding Feature

## Overview

Trainers and nutritionists can complete their professional onboarding once their accounts are verified. This onboarding allows them to add a bio and select their specialties, which helps them connect with potential clients.

## Features

### 1. Verification Requirement

- Only **verified** trainers and nutritionists can complete onboarding
- Verification status is determined by the `is_verified` column in their respective profile tables
- Unverified professionals see a pending verification message

### 2. Professional Bio

- Required field where professionals describe their:
  - Experience
  - Qualifications
  - Approach and philosophy
  - What makes them unique
- Character count displayed in real-time
- Supports multi-line text input

### 3. Specialty Selection

#### Trainer Specialties (22 options)

- Weight Loss
- Muscle Building
- Strength Training
- Cardiovascular Training
- HIIT (High-Intensity Interval Training)
- CrossFit
- Powerlifting
- Olympic Weightlifting
- Bodybuilding
- Functional Training
- Sports-Specific Training
- Injury Rehabilitation
- Pre/Postnatal Fitness
- Senior Fitness
- Youth Fitness
- Flexibility & Mobility
- Yoga
- Pilates
- Boxing & Martial Arts
- Running & Marathon Training
- Calisthenics
- TRX/Suspension Training

#### Nutritionist Specialties (22 options)

- Weight Management
- Sports Nutrition
- Clinical Nutrition
- Pediatric Nutrition
- Geriatric Nutrition
- Prenatal/Postnatal Nutrition
- Diabetes Management
- Heart Health
- Digestive Health
- Food Allergies & Intolerances
- Plant-Based/Vegan Nutrition
- Ketogenic Diet
- Mediterranean Diet
- Eating Disorders
- Autoimmune Conditions
- Hormone Balance
- Mental Health & Nutrition
- Meal Planning
- Supplement Guidance
- Metabolic Health
- Renal Nutrition
- Oncology Nutrition

#### Custom Specialties

- Professionals can add custom specialties using the "Add Custom Specialty" option
- Custom specialties are displayed with remove buttons
- Supports multiple custom additions

### 4. Multi-select Interface

- Checkbox-based selection for predefined specialties
- Grid layout for easy scanning
- Counter showing number of selected specialties
- At least one specialty required

## API Endpoints

### GET /api/professionals/onboarding

**Purpose**: Fetch professional's current onboarding status and profile

**Authentication**: Required

**Response**:

```json
{
  "role": "trainer" | "nutritionist",
  "profile": {
    "user_id": "uuid",
    "bio": "string | null",
    "specialties": ["string"],
    "is_verified": true
  },
  "isVerified": true,
  "hasCompletedOnboarding": true
}
```

**Error Responses**:

- `401`: Not authenticated
- `403`: User is a client (not allowed)
- `404`: Professional profile not found

### PUT /api/professionals/onboarding

**Purpose**: Update professional profile with bio and specialties

**Authentication**: Required

**Request Body**:

```json
{
  "bio": "Professional bio text...",
  "specialties": ["Specialty 1", "Specialty 2", "Custom Specialty"]
}
```

**Validation**:

- Bio must be non-empty string
- At least one specialty required
- All specialties must be strings
- User must be verified

**Response**:

```json
{
  "message": "Professional onboarding completed successfully",
  "profile": {
    "user_id": "uuid",
    "bio": "string",
    "specialties": ["string"],
    "is_verified": true
  }
}
```

**Error Responses**:

- `401`: Not authenticated
- `403`: User is a client or not verified
- `400`: Invalid bio or specialties
- `404`: Professional profile not found
- `500`: Database error

## UI Flow

### 1. Dashboard Integration

The dashboard shows different content based on verification and onboarding status:

**Unverified Professional**:

- Shows "Pending Verification" status

**Verified but Incomplete Onboarding**:

- Shows blue alert box with "Complete Onboarding" button
- Quick Actions section includes "Professional Profile" card

**Verified and Complete Onboarding**:

- Displays bio and specialties in dashboard
- Quick Actions still shows "Professional Profile" for updates

### 2. Onboarding Page (/professional-onboarding)

**Unverified State**:

- ⏳ icon with "Verification Pending" message
- Explanation that onboarding will be available after verification
- "Back to Dashboard" button

**Verified State**:

- Full onboarding form with:
  - Bio textarea
  - Specialty checkboxes (grid layout)
  - Custom specialty input
  - Cancel and Submit buttons
- Real-time validation
- Loading states during submission

### 3. Form Behavior

- Pre-fills existing bio and specialties if already set
- "Update Profile" button text if already completed
- "Complete Onboarding" text for first-time completion
- Form disabled during submission
- Success redirects to dashboard

## Database Updates

The onboarding updates the following columns in the respective tables:

**trainer_profiles table**:

```sql
UPDATE trainer_profiles
SET bio = ?, specialties = ?
WHERE user_id = ?
```

**nutritionist_profiles table**:

```sql
UPDATE nutritionist_profiles
SET bio = ?, specialties = ?
WHERE user_id = ?
```

## File Structure

```
lib/
  specialties.ts                    # Specialty lists and types

app/
  professional-onboarding/
    page.tsx                        # Professional onboarding UI
  api/
    professionals/
      onboarding/
        route.ts                    # API endpoints for onboarding
  dashboard/
    page.tsx                        # Updated with professional prompts
```

## Testing the Feature

### 1. Create a Trainer/Nutritionist Account

```bash
# Sign up with role "trainer" or "nutritionist"
# Complete the profile
```

### 2. Verify the Account (Manual Step)

```sql
-- In Supabase SQL Editor
UPDATE trainer_profiles
SET is_verified = true
WHERE user_id = 'your-user-id';

-- OR for nutritionist
UPDATE nutritionist_profiles
SET is_verified = true
WHERE user_id = 'your-user-id';
```

### 3. Complete Onboarding

1. Go to dashboard
2. See the "Complete Onboarding" prompt
3. Click "Complete Onboarding" or "Professional Profile" in Quick Actions
4. Fill in bio (required)
5. Select at least one specialty
6. Optionally add custom specialties
7. Submit

### 4. Verify Results

- Dashboard now shows bio and specialties
- Can update anytime via "Professional Profile" Quick Action
- Profile information displayed in professional sections

## Integration Points

### With Existing Features

- **Dashboard**: Shows onboarding prompts and completed data
- **Authentication**: Requires logged-in user
- **Role System**: Only trainers and nutritionists can access
- **Verification System**: Gates onboarding behind verification

### Future Enhancements

- Search/filter professionals by specialty
- Client-professional matching based on specialties
- Specialty-based recommendations
- Professional directory with bio previews
- Rating/review system linked to specialties

## Security Considerations

1. ✅ Only verified professionals can complete onboarding
2. ✅ Role-based access control (trainers/nutritionists only)
3. ✅ Input validation on bio and specialties
4. ✅ Server-side verification check
5. ✅ User can only update their own profile

## Specialty Management

Specialties are stored as a JSON array in PostgreSQL:

```json
["Weight Loss", "Strength Training", "Custom Specialty"]
```

This allows:

- Flexible addition of custom specialties
- Easy filtering and searching
- Simple display with `join(", ")`
- Type-safe constants in frontend

## Error Handling

The system handles various error scenarios:

- Not authenticated → Redirect to sign in
- Wrong role (client) → Redirect to dashboard
- Not verified → Show pending message
- Empty bio → Validation error
- No specialties → Validation error
- Database errors → User-friendly error message

## Accessibility

- Checkbox inputs with labels
- Clear error messages
- Loading states with disabled inputs
- Keyboard navigation support
- Screen reader friendly labels
