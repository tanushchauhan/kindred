/**
 * Database Types - Aligned with Supabase Schema
 */

// User roles
export type UserRole = "client" | "trainer" | "nutritionist";

// Base user type from the users table
export interface User {
  id: string;
  role: UserRole;
  full_name: string | null;
  user_name: string | null;
  phone_number: string | null;
  gender: string | null;
  location: string | null;
  birth_date: string | null;
  created_at: string;
  updated_at: string;
}

// Client profile extension
export interface ClientProfile {
  user_id: string;
  onboarding_data: Record<string, unknown> | null;
}

// Trainer profile extension
export interface TrainerProfile {
  user_id: string;
  bio: string | null;
  specialties: string[];
  is_verified: boolean;
}

// Nutritionist profile extension
export interface NutritionistProfile {
  user_id: string;
  bio: string | null;
  specialties: string[];
  is_verified: boolean;
}

// Complete user profiles with joined data
export type ClientUser = User & {
  client_profiles: ClientProfile[];
};

export type TrainerUser = User & {
  trainer_profiles: TrainerProfile[];
};

export type NutritionistUser = User & {
  nutritionist_profiles: NutritionistProfile[];
};

export type CompleteUserProfile = ClientUser | TrainerUser | NutritionistUser;

/**
 * API Request/Response Types
 */

// Signup request
export interface SignupRequest {
  email: string;
  password: string;
  role: UserRole;
  fullName: string;
}

// Login request
export interface LoginRequest {
  email: string;
  password: string;
}

// Onboarding data (flexible structure for client questionnaire)
export interface OnboardingData {
  [key: string]: unknown;
}

// API error response
export interface ApiErrorResponse {
  error: string;
}

// API success response for signup
export interface SignupResponse {
  user: {
    id: string;
    email?: string;
    [key: string]: unknown;
  };
  message: string;
}

// API success response for login
export interface LoginResponse {
  session: {
    access_token: string;
    refresh_token: string;
    [key: string]: unknown;
  };
  user: {
    id: string;
    email?: string;
    [key: string]: unknown;
  };
  message: string;
}

// API success response for onboarding
export interface OnboardingResponse {
  message: string;
  data: OnboardingData;
}

/**
 * AI Matching Types
 */

// Match result for a single professional
export interface ProfessionalMatch {
  user_id: string;
  full_name: string;
  bio: string;
  specialties: string[];
  reasoning: string;
}

// Complete matching result
export interface MatchingResult {
  matches: {
    trainer: ProfessionalMatch;
    nutritionist: ProfessionalMatch;
  };
  metadata: {
    query_timestamp: string;
    candidates_retrieved: {
      trainers: number;
      nutritionists: number;
    };
    processing_time_ms: number;
  };
}

// Embedding generation result
export interface EmbeddingGenerationResult {
  message: string;
  results: {
    trainers: {
      processed: number;
      success: number;
      failed: number;
      errors: string[];
    };
    nutritionists: {
      processed: number;
      success: number;
      failed: number;
      errors: string[];
    };
  };
  timestamp: string;
}

/**
 * Nutrition Plan Types
 */

// Macro goal types aligned with HealthKit nutrition data
export type MacroGoalType =
  | "protein"
  | "carbohydrates"
  | "fat"
  | "calories"
  | "fiber"
  | "water"
  | "sugar";

// Units for macro goals
export type MacroUnit = "grams" | "calories" | "ml" | "oz";

// Macro goal within a nutrition plan
export interface MacroGoal {
  id: string;
  nutrition_plan_id: string;
  goal_type: MacroGoalType;
  target_amount: number;
  unit: MacroUnit;
  notes: string | null;
  created_at: string;
}

// Nutrition plan created by nutritionist
export interface NutritionPlan {
  id: string;
  nutritionist_id: string;
  client_id: string;
  title: string;
  description: string | null;
  start_date: string;
  end_date: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// Complete nutrition plan with macro goals
export interface NutritionPlanWithGoals extends NutritionPlan {
  macro_goals: MacroGoal[];
}

/**
 * Exercise Plan Types
 */

// Exercise within an exercise plan
export interface Exercise {
  id: string;
  exercise_plan_id: string;
  name: string;
  description: string | null;
  sets: number | null;
  reps: number | null;
  duration_minutes: number | null;
  scheduled_days: number[]; // 0=Sunday, 1=Monday, etc.
  notes: string | null;
  created_at: string;
}

// Exercise plan created by trainer
export interface ExercisePlan {
  id: string;
  trainer_id: string;
  client_id: string;
  title: string;
  description: string | null;
  start_date: string;
  end_date: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// Complete exercise plan with exercises
export interface ExercisePlanWithExercises extends ExercisePlan {
  exercises: Exercise[];
}

// Exercise completion by client
export interface ExerciseCompletion {
  id: string;
  exercise_id: string;
  client_id: string;
  completion_date: string;
  completed: boolean;
  notes: string | null;
  created_at: string;
}

/**
 * HealthKit Data Types
 */

// Types of HealthKit data we track
export type HealthKitDataType =
  // Nutrition
  | "protein"
  | "carbohydrates"
  | "fat"
  | "calories"
  | "fiber"
  | "water"
  | "sugar"
  // Fitness
  | "steps"
  | "active_energy"
  | "workout"
  | "heart_rate";

// HealthKit data entry
export interface HealthKitData {
  id: string;
  client_id: string;
  data_type: HealthKitDataType;
  value: number;
  unit: string;
  recorded_at: string;
  metadata: Record<string, unknown> | null;
  synced_at: string;
}

/**
 * API Request/Response Types for Plans
 */

// Request to create a nutrition plan
export interface CreateNutritionPlanRequest {
  client_id: string;
  title: string;
  description?: string;
  start_date: string;
  end_date?: string;
  macro_goals: {
    goal_type: MacroGoalType;
    target_amount: number;
    unit: MacroUnit;
    notes?: string;
  }[];
}

// Request to create an exercise plan
export interface CreateExercisePlanRequest {
  client_id: string;
  title: string;
  description?: string;
  start_date: string;
  end_date?: string;
  exercises: {
    name: string;
    description?: string;
    sets?: number;
    reps?: number;
    duration_minutes?: number;
    scheduled_days: number[];
    notes?: string;
  }[];
}

// Request to sync HealthKit data
export interface SyncHealthKitDataRequest {
  data: {
    data_type: HealthKitDataType;
    value: number;
    unit: string;
    recorded_at: string;
    metadata?: Record<string, unknown>;
  }[];
}

// Request to mark exercise as complete
export interface MarkExerciseCompleteRequest {
  exercise_id: string;
  completion_date: string;
  completed: boolean;
  notes?: string;
}
