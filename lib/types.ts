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
