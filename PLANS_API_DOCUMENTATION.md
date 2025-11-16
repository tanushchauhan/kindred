# Plans & HealthKit API Documentation

This document describes the API endpoints for nutrition plans, exercise plans, and HealthKit data synchronization.

## Base URL

All API endpoints are relative to the application's base URL. For development use this:

```
https://kindreddev.tanushchauhan.com
```

## Quick Reference for Mobile Developers

### Client Endpoints (Mobile App Users)

- `GET /api/me/nutrition-plans` - Get my nutrition plans
- `GET /api/me/exercise-plans` - Get my exercise plans
- `POST /api/me/exercise-completions` - Mark exercise complete
- `GET /api/me/exercise-completions` - Get my exercise completions
- `POST /api/me/healthkit` - Sync HealthKit data
- `GET /api/me/healthkit` - Get my health data

### Professional Endpoints (Trainers & Nutritionists)

- `POST /api/professionals/nutrition-plans` - Create nutrition plan
- `PUT /api/professionals/nutrition-plans/[planId]` - Update nutrition plan
- `DELETE /api/professionals/nutrition-plans/[planId]` - Delete nutrition plan
- `PATCH /api/professionals/nutrition-plans/[planId]/toggle-active` - Toggle active status
- `POST /api/professionals/exercise-plans` - Create exercise plan
- `PUT /api/professionals/exercise-plans/[planId]` - Update exercise plan
- `DELETE /api/professionals/exercise-plans/[planId]` - Delete exercise plan
- `PATCH /api/professionals/exercise-plans/[planId]/toggle-active` - Toggle active status
- `GET /api/professionals/clients/[clientId]/exercise-completions` - View client progress

### Authentication

All endpoints require session-based authentication. Include credentials in requests:

```javascript
fetch(url, {
  credentials: "include",
  headers: {
    "Content-Type": "application/json",
  },
});
```

## Table of Contents

- [Nutrition Plans](#nutrition-plans)
  - [Create Nutrition Plan](#create-nutrition-plan)
  - [Get Nutrition Plans (Nutritionist)](#get-nutrition-plans-nutritionist)
  - [Get Nutrition Plans (Client)](#get-nutrition-plans-client)
  - [Update Nutrition Plan](#update-nutrition-plan)
  - [Delete Nutrition Plan](#delete-nutrition-plan)
  - [Toggle Plan Active Status](#toggle-nutrition-plan-active-status)
- [Exercise Plans](#exercise-plans)
  - [Create Exercise Plan](#create-exercise-plan)
  - [Get Exercise Plans (Trainer)](#get-exercise-plans-trainer)
  - [Get Exercise Plans (Client)](#get-exercise-plans-client)
  - [Update Exercise Plan](#update-exercise-plan)
  - [Delete Exercise Plan](#delete-exercise-plan)
  - [Toggle Plan Active Status](#toggle-exercise-plan-active-status)
- [Exercise Completions](#exercise-completions)
  - [Mark Exercise Complete](#mark-exercise-complete)
  - [Get Exercise Completions](#get-exercise-completions)
  - [Get Client Exercise Completions (Professional)](#get-client-exercise-completions-professional)
  - [Delete Exercise Completion](#delete-exercise-completion)
- [HealthKit Data](#healthkit-data)
  - [Sync HealthKit Data](#sync-healthkit-data)
  - [Get HealthKit Data](#get-healthkit-data)
  - [Delete HealthKit Data](#delete-healthkit-data)
- [Error Responses](#error-responses)
- [Implementation Notes](#implementation-notes)

---

## Nutrition Plans

### Create Nutrition Plan

**POST** `/api/professionals/nutrition-plans`

Create a new nutrition plan with macro goals for a matched client.

**Authorization:** Nutritionist (verified)

**Request Body:**

```json
{
  "client_id": "uuid",
  "title": "My Nutrition Plan",
  "description": "Optional description",
  "start_date": "2025-01-01",
  "end_date": "2025-03-31",
  "macro_goals": [
    {
      "goal_type": "protein",
      "target_amount": 150,
      "unit": "grams",
      "notes": "Lean proteins preferred"
    },
    {
      "goal_type": "calories",
      "target_amount": 2000,
      "unit": "calories"
    }
  ]
}
```

**Response:** `201 Created`

```json
{
  "message": "Nutrition plan created successfully",
  "plan": {
    "id": "uuid",
    "nutritionist_id": "uuid",
    "client_id": "uuid",
    "title": "My Nutrition Plan",
    "description": "Optional description",
    "start_date": "2025-01-01",
    "end_date": "2025-03-31",
    "is_active": true,
    "created_at": "2025-11-16T12:00:00Z",
    "updated_at": "2025-11-16T12:00:00Z",
    "macro_goals": [...]
  }
}
```

---

### Get Nutrition Plans (Nutritionist)

**GET** `/api/professionals/nutrition-plans`

Get all nutrition plans created by the authenticated nutritionist.

**Authorization:** Nutritionist

**Query Parameters:**

- `client_id` (optional): Filter by specific client
- `active_only` (optional): If "true", only return active plans

**Response:** `200 OK`

```json
{
  "plans": [
    {
      "id": "uuid",
      "title": "My Nutrition Plan",
      "macro_goals": [...],
      "users": {
        "id": "uuid",
        "full_name": "Client Name",
        "user_name": "client123"
      }
    }
  ],
  "count": 1
}
```

---

### Update Nutrition Plan

**PUT** `/api/professionals/nutrition-plans/[planId]`

Update an existing nutrition plan and its macro goals.

**Authorization:** Nutritionist (plan owner)

**Request Body:**

```json
{
  "title": "Updated Nutrition Plan",
  "description": "Updated description",
  "start_date": "2025-01-01",
  "end_date": "2025-04-30",
  "macro_goals": [
    {
      "goal_type": "protein",
      "target_amount": 160,
      "unit": "grams",
      "notes": "Increased protein target"
    },
    {
      "goal_type": "calories",
      "target_amount": 2200,
      "unit": "calories"
    }
  ]
}
```

**Response:** `200 OK`

```json
{
  "message": "Nutrition plan updated successfully",
  "plan": {
    "id": "uuid",
    "title": "Updated Nutrition Plan",
    "macro_goals": [...]
  }
}
```

---

### Delete Nutrition Plan

**DELETE** `/api/professionals/nutrition-plans/[planId]`

Delete a nutrition plan and all associated macro goals.

**Authorization:** Nutritionist (plan owner)

**Response:** `200 OK`

```json
{
  "message": "Nutrition plan deleted successfully"
}
```

---

### Toggle Nutrition Plan Active Status

**PATCH** `/api/professionals/nutrition-plans/[planId]/toggle-active`

Toggle the active status of a nutrition plan. When activating a plan, all other plans for the same client are automatically deactivated.

**Authorization:** Nutritionist (plan owner)

**Response:** `200 OK`

```json
{
  "message": "Plan activated successfully",
  "plan": {
    "id": "uuid",
    "is_active": true,
    "updated_at": "2025-11-16T12:00:00Z"
  }
}
```

---

### Get Nutrition Plans (Client)

**GET** `/api/me/nutrition-plans`

Get nutrition plans assigned to the authenticated client.

**Authorization:** Client

**Query Parameters:**

- `active_only` (optional): If "true", only return active plans

**Response:** `200 OK`

```json
{
  "plans": [
    {
      "id": "uuid",
      "title": "My Nutrition Plan",
      "macro_goals": [...],
      "users": {
        "id": "uuid",
        "full_name": "Nutritionist Name",
        "user_name": "nutritionist123"
      }
    }
  ],
  "count": 1
}
```

---

## Exercise Plans

### Create Exercise Plan

**POST** `/api/professionals/exercise-plans`

Create a new exercise plan with exercises for a matched client.

**Authorization:** Trainer (verified)

**Request Body:**

```json
{
  "client_id": "uuid",
  "title": "12-Week Strength Program",
  "description": "Focus on compound movements",
  "start_date": "2025-01-01",
  "end_date": "2025-03-31",
  "exercises": [
    {
      "name": "Squats",
      "description": "Barbell back squats",
      "sets": 4,
      "reps": 8,
      "scheduled_days": [1, 3, 5],
      "notes": "Focus on depth"
    },
    {
      "name": "Running",
      "duration_minutes": 30,
      "scheduled_days": [0, 2, 4, 6],
      "notes": "Easy pace"
    }
  ]
}
```

**Scheduled Days:** 0=Sunday, 1=Monday, 2=Tuesday, 3=Wednesday, 4=Thursday, 5=Friday, 6=Saturday

**Response:** `201 Created`

```json
{
  "message": "Exercise plan created successfully",
  "plan": {
    "id": "uuid",
    "trainer_id": "uuid",
    "client_id": "uuid",
    "title": "12-Week Strength Program",
    "exercises": [...]
  }
}
```

---

### Get Exercise Plans (Trainer)

**GET** `/api/professionals/exercise-plans`

Get all exercise plans created by the authenticated trainer.

**Authorization:** Trainer

**Query Parameters:**

- `client_id` (optional): Filter by specific client
- `active_only` (optional): If "true", only return active plans

**Response:** `200 OK`

---

### Update Exercise Plan

**PUT** `/api/professionals/exercise-plans/[planId]`

Update an existing exercise plan and its exercises.

**Authorization:** Trainer (plan owner)

**Request Body:**

```json
{
  "title": "Updated Strength Program",
  "description": "Modified focus on upper body",
  "start_date": "2025-01-01",
  "end_date": "2025-04-30",
  "exercises": [
    {
      "name": "Bench Press",
      "description": "Barbell bench press",
      "sets": 4,
      "reps": 8,
      "scheduled_days": [1, 3, 5],
      "notes": "Increase weight gradually"
    },
    {
      "name": "Running",
      "duration_minutes": 30,
      "scheduled_days": [0, 2, 4, 6]
    }
  ]
}
```

**Response:** `200 OK`

```json
{
  "message": "Exercise plan updated successfully",
  "plan": {
    "id": "uuid",
    "title": "Updated Strength Program",
    "exercises": [...]
  }
}
```

---

### Delete Exercise Plan

**DELETE** `/api/professionals/exercise-plans/[planId]`

Delete an exercise plan and all associated exercises and completions.

**Authorization:** Trainer (plan owner)

**Response:** `200 OK`

```json
{
  "message": "Exercise plan deleted successfully"
}
```

---

### Toggle Exercise Plan Active Status

**PATCH** `/api/professionals/exercise-plans/[planId]/toggle-active`

Toggle the active status of an exercise plan. When activating a plan, all other plans for the same client are automatically deactivated.

**Authorization:** Trainer (plan owner)

**Response:** `200 OK`

```json
{
  "message": "Plan activated successfully",
  "plan": {
    "id": "uuid",
    "is_active": true,
    "updated_at": "2025-11-16T12:00:00Z"
  }
}
```

---

### Get Exercise Plans (Client)

**GET** `/api/me/exercise-plans`

Get exercise plans assigned to the authenticated client.

**Authorization:** Client

**Query Parameters:**

- `active_only` (optional): If "true", only return active plans
- `include_completions` (optional): If "true", include exercise completion data

**Response:** `200 OK`

```json
{
  "plans": [
    {
      "id": "uuid",
      "title": "12-Week Strength Program",
      "exercises": [
        {
          "id": "uuid",
          "name": "Squats",
          "scheduled_days": [1, 3, 5],
          "exercise_completions": [...]
        }
      ],
      "users": {
        "full_name": "Trainer Name"
      }
    }
  ],
  "count": 1
}
```

---

## Exercise Completions

### Mark Exercise Complete

**POST** `/api/me/exercise-completions`

Mark an exercise as complete or incomplete for a specific date.

**Authorization:** Client

**Request Body:**

```json
{
  "exercise_id": "uuid",
  "completion_date": "2025-01-15",
  "completed": true,
  "notes": "Felt great today!"
}
```

**Response:** `200 OK`

```json
{
  "message": "Exercise marked as complete",
  "completion": {
    "id": "uuid",
    "exercise_id": "uuid",
    "client_id": "uuid",
    "completion_date": "2025-01-15",
    "completed": true,
    "notes": "Felt great today!",
    "created_at": "2025-11-16T12:00:00Z"
  }
}
```

---

### Get Exercise Completions

**GET** `/api/me/exercise-completions`

Get exercise completions for the authenticated client.

**Authorization:** Client

**Query Parameters:**

- `exercise_id` (optional): Filter by specific exercise
- `start_date` (optional): Filter completions from this date
- `end_date` (optional): Filter completions until this date
- `completed_only` (optional): If "true", only return completed exercises

**Response:** `200 OK`

```json
{
  "completions": [
    {
      "id": "uuid",
      "exercise_id": "uuid",
      "completion_date": "2025-01-15",
      "completed": true,
      "exercises": {
        "id": "uuid",
        "name": "Squats"
      }
    }
  ],
  "count": 1
}
```

---

### Get Client Exercise Completions (Professional)

**GET** `/api/professionals/clients/[clientId]/exercise-completions`

Get exercise completions for a specific client (for trainers to view client progress).

**Authorization:** Trainer (must be matched with client)

**Query Parameters:**

- `start_date` (optional): Filter completions from this date (YYYY-MM-DD)
- `end_date` (optional): Filter completions until this date (YYYY-MM-DD)

**Example:**

```
GET /api/professionals/clients/client-uuid/exercise-completions?start_date=2025-01-01
```

**Response:** `200 OK`

```json
{
  "completions": [
    {
      "id": "uuid",
      "exercise_id": "uuid",
      "completion_date": "2025-01-15",
      "completed": true,
      "notes": "Great workout!",
      "exercises": {
        "id": "uuid",
        "name": "Squats",
        "exercise_plan_id": "uuid"
      }
    }
  ],
  "count": 1
}
```

---

### Delete Exercise Completion

**DELETE** `/api/me/exercise-completions?completion_id=uuid`

Delete a specific exercise completion.

**Authorization:** Client (completion owner)

**Response:** `200 OK`

---

## HealthKit Data

### Sync HealthKit Data

**POST** `/api/me/healthkit`

Sync health and fitness data from HealthKit to the server. Can also be used for manual data entry from the web app.

**Authorization:** Client

**Request Body:**

```json
{
  "data": [
    {
      "data_type": "protein",
      "value": 145,
      "unit": "grams",
      "recorded_at": "2025-01-15T14:30:00Z",
      "metadata": {
        "source": "MyFitnessPal",
        "meal": "lunch"
      }
    },
    {
      "data_type": "steps",
      "value": 8543,
      "unit": "steps",
      "recorded_at": "2025-01-15T23:59:00Z"
    },
    {
      "data_type": "active_energy",
      "value": 450,
      "unit": "calories",
      "recorded_at": "2025-01-15T18:00:00Z",
      "metadata": {
        "workout_type": "running"
      }
    },
    {
      "data_type": "heart_rate",
      "value": 72,
      "unit": "bpm",
      "recorded_at": "2025-01-15T08:00:00Z",
      "metadata": {
        "notes": "Resting heart rate"
      }
    }
  ]
}
```

**Supported Data Types & Units:**

- **Nutrition:**
  - `protein` (grams)
  - `carbohydrates` (grams)
  - `fat` (grams)
  - `calories` (kcal)
  - `fiber` (grams)
  - `water` (ml)
  - `sugar` (grams)
- **Fitness:**
  - `steps` (steps)
  - `active_energy` (kcal)
  - `workout` (minutes)
  - `heart_rate` (bpm)

**Response:** `201 Created`

```json
{
  "message": "HealthKit data synced successfully",
  "synced_count": 4,
  "data": [
    {
      "id": "uuid",
      "client_id": "uuid",
      "data_type": "protein",
      "value": 145,
      "unit": "grams",
      "recorded_at": "2025-01-15T14:30:00Z",
      "metadata": {
        "source": "MyFitnessPal",
        "meal": "lunch"
      },
      "synced_at": "2025-11-16T12:00:00Z"
    }
  ]
}
```

**Notes:**

- The `metadata` field is optional and can store any JSON object
- Duplicate entries (same data_type and recorded_at) will be prevented
- Batch uploads are recommended for efficiency

---

### Get HealthKit Data

**GET** `/api/me/healthkit`

Get HealthKit data for the authenticated user or their matched clients.

**Authorization:** Client, Trainer, or Nutritionist

**Query Parameters:**

- `client_id` (optional, professionals only): Get data for a specific matched client
- `data_type` (optional): Filter by specific data type
- `start_date` (optional): Filter data from this date
- `end_date` (optional): Filter data until this date
- `limit` (optional): Limit number of results

**Examples:**

Client viewing their own data:

```
GET /api/me/healthkit?data_type=protein&start_date=2025-01-01
```

Nutritionist viewing client's nutrition data:

```
GET /api/me/healthkit?client_id=uuid&data_type=calories&start_date=2025-01-01&limit=100
```

Trainer viewing client's fitness data:

```
GET /api/me/healthkit?client_id=uuid&data_type=steps&start_date=2025-01-10&end_date=2025-01-15
```

**Response:** `200 OK`

```json
{
  "data": [
    {
      "id": "uuid",
      "client_id": "uuid",
      "data_type": "protein",
      "value": 145,
      "unit": "grams",
      "recorded_at": "2025-01-15T14:30:00Z",
      "metadata": {
        "source": "MyFitnessPal"
      },
      "synced_at": "2025-01-15T14:35:00Z"
    }
  ],
  "count": 1,
  "client_id": "uuid"
}
```

---

### Delete HealthKit Data

**DELETE** `/api/me/healthkit?data_id=uuid`

Delete a specific HealthKit data entry.

**Authorization:** Client (data owner)

**Response:** `200 OK`

---

## Error Responses

All endpoints may return the following error responses:

**401 Unauthorized**

```json
{
  "error": "Unauthorized"
}
```

**403 Forbidden**

```json
{
  "error": "Only verified nutritionists can create plans"
}
```

**404 Not Found**

```json
{
  "error": "Plan not found"
}
```

**400 Bad Request**

```json
{
  "error": "Missing required fields: client_id, title, start_date"
}
```

**500 Internal Server Error**

```json
{
  "error": "Internal server error"
}
```

---

## Implementation Notes

### Authentication

All endpoints require authentication via session cookies:

- Include `credentials: "include"` in fetch requests
- Cookies are set automatically after successful login via `/api/auth/login`
- Sessions expire after inactivity

### Plan Management Best Practices

**Active Plan Logic:**

- Only one nutrition plan and one exercise plan can be active per client at a time
- Use the toggle-active endpoint to switch between plans
- The API automatically deactivates other plans when activating a new one
- Clients should primarily interact with their active plan

**Creating Plans:**

- Professionals must be verified before creating plans
- Client-professional match must exist (validated via `client_matches` table)
- All plans default to `is_active: true` on creation
- Existing active plans are automatically deactivated

**Updating Plans:**

- PUT endpoints replace all nested data (macro_goals, exercises)
- Include all macro goals/exercises in the update request, not just changed items
- The API will delete old nested records and insert new ones

**Deleting Plans:**

- Deletion cascades to related records (macro_goals, exercises, completions)
- Cannot be undone - consider adding a confirmation dialog in your UI
- Only the plan owner can delete

### Background Sync Strategy (Mobile App)

For HealthKit data synchronization:

1. **Manual Sync**: Implement pull-to-refresh for immediate updates
2. **Background Fetch**: Use iOS Background Fetch with 15-minute minimum intervals
3. **Batch Uploads**: Collect data throughout the day and sync in batches to reduce API calls
4. **Duplicate Prevention**:
   - Track `synced_at` timestamps locally
   - The API prevents duplicate entries based on `data_type` and `recorded_at`
   - Consider implementing a local cache to avoid re-syncing the same data

**Recommended Sync Flow:**

```swift
// Example iOS implementation
func syncHealthKitData() async {
    let unsyncedData = getUnsyncedDataFromLocalStore()

    guard !unsyncedData.isEmpty else { return }

    let batches = unsyncedData.chunked(into: 50) // Batch size of 50

    for batch in batches {
        do {
            let response = try await apiClient.post("/api/me/healthkit", body: ["data": batch])
            markAsSynced(batch)
        } catch {
            // Retry logic or mark for next sync
            handleSyncError(error)
        }
    }
}
```

### Exercise Completion Tracking

- Uses upsert to prevent duplicate completions for the same exercise on the same day
- Clients can mark exercises as complete/incomplete and add notes
- Trainers can view completion data through the exercise plans endpoint or dedicated completion endpoint
- Completion data is used for progress tracking and analytics

**Mobile App Recommendations:**

- Show scheduled exercises based on `scheduled_days` array
- Allow clients to mark exercises complete with a single tap
- Store completions locally and sync periodically
- Display completion history in a calendar or list view

### Professional Access to Client Data

- RLS (Row Level Security) policies ensure professionals can only access data for their matched clients
- Professionals must be verified to create plans
- Client-professional relationships are validated through the `client_matches` table
- The `client_id` parameter is validated against active matches

### Data Privacy & Security

- All health data is encrypted in transit (HTTPS)
- RLS policies prevent unauthorized access
- Clients own their health data and can delete it at any time
- Metadata can include sensitive information - avoid storing PII unless necessary

### Error Handling

**Common Error Scenarios:**

- **401 Unauthorized**: Session expired - redirect to login
- **403 Forbidden**: Insufficient permissions - verify user role and verification status
- **404 Not Found**: Resource doesn't exist or user lacks access
- **400 Bad Request**: Invalid data format - check request body structure
- **500 Internal Server Error**: Server issue - implement retry logic with exponential backoff

**Mobile App Best Practices:**

- Implement offline support with local data caching
- Queue failed requests and retry when connectivity is restored
- Show user-friendly error messages
- Log errors for debugging but sanitize sensitive data

### Rate Limiting Considerations

- No strict rate limits currently enforced

### Testing

**Sample Test Scenarios:**

1. **Create and activate multiple plans** - verify only one stays active
2. **Sync duplicate health data** - verify duplicates are rejected
3. **Update plan with incomplete data** - verify validation errors
4. **Access another client's data** - verify 403 forbidden response
5. **Delete plan with completions** - verify cascade deletion works

### Web App Integration

The web app provides:

- Manual health data entry at `/health-data`
- Plan management for professionals at `/professionals/clients/[clientId]`
- Client plan viewing (in development)

Mobile apps should complement this with:

- Native HealthKit integration for automatic data sync
- Push notifications for new plans(not need for the demo)
- Offline-first architecture(not needed for the demo)
- Native workout/meal tracking interfaces(using a 3rd party app)
