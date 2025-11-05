import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabaseServer";

/**
 * POST /api/auth/complete-profile
 * Completes user profile after email confirmation
 * Creates records in users table and role-specific profile tables
 * This route should be called after the user confirms their email
 */
export async function POST(request: Request) {
  try {
    // Create server-side Supabase client
    const supabase = await createServerSupabaseClient();

    // Get the authenticated user (must be confirmed)
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: "Unauthorized. Please log in after confirming your email." },
        { status: 401 }
      );
    }

    // Check if user profile already exists
    const { data: existingUser } = await supabase
      .from("users")
      .select("id")
      .eq("id", user.id)
      .single();

    if (existingUser) {
      return NextResponse.json(
        { error: "Profile already completed" },
        { status: 400 }
      );
    }

    // Parse request body for profile data
    const body = await request.json();
    const {
      role,
      fullName,
      userName,
      phoneNumber,
      gender,
      location,
      birthDate,
    } = body;

    // Validate required fields
    if (!role || !fullName || !userName) {
      return NextResponse.json(
        {
          error:
            "Missing required fields: role, fullName, and userName are required",
        },
        { status: 400 }
      );
    }

    // Validate username format (alphanumeric, hyphens, underscores only)
    const usernameRegex = /^[a-zA-Z0-9_-]+$/;
    if (!usernameRegex.test(userName)) {
      return NextResponse.json(
        {
          error:
            "Invalid username format. Only letters, numbers, hyphens, and underscores are allowed",
        },
        { status: 400 }
      );
    }

    // Check if username is already taken
    const { data: existingUsername } = await supabase
      .from("users")
      .select("id")
      .eq("user_name", userName)
      .single();

    if (existingUsername) {
      return NextResponse.json(
        { error: "Username is already taken. Please choose a different one." },
        { status: 400 }
      );
    }

    // Validate role
    const validRoles = ["client", "trainer", "nutritionist"];
    if (!validRoles.includes(role)) {
      return NextResponse.json(
        { error: `Invalid role. Must be one of: ${validRoles.join(", ")}` },
        { status: 400 }
      );
    }

    // Insert into public.users table
    const { error: userInsertError } = await supabase.from("users").insert({
      id: user.id,
      role: role,
      full_name: fullName,
      user_name: userName,
      phone_number: phoneNumber || null,
      gender: gender || null,
      location: location || null,
      birth_date: birthDate || null,
    });

    if (userInsertError) {
      console.error("Error creating user record:", userInsertError);
      return NextResponse.json(
        {
          error: "Failed to create user profile",
          details: userInsertError.message,
        },
        { status: 500 }
      );
    }

    // Create role-specific profile record
    let profileInsertError = null;

    if (role === "client") {
      const { error } = await supabase.from("client_profiles").insert({
        user_id: user.id,
        onboarding_data: null,
      });
      profileInsertError = error;
    } else if (role === "trainer") {
      const { error } = await supabase.from("trainer_profiles").insert({
        user_id: user.id,
        bio: null,
        specialties: [],
        is_verified: false,
      });
      profileInsertError = error;
    } else if (role === "nutritionist") {
      const { error } = await supabase.from("nutritionist_profiles").insert({
        user_id: user.id,
        bio: null,
        specialties: [],
        is_verified: false,
      });
      profileInsertError = error;
    }

    if (profileInsertError) {
      console.error("Error creating profile record:", profileInsertError);
      return NextResponse.json(
        {
          error: "Failed to create user profile",
          details: profileInsertError.message,
        },
        { status: 500 }
      );
    }

    // Return success response
    return NextResponse.json(
      {
        message: "Profile completed successfully",
        user: {
          id: user.id,
          email: user.email,
          role: role,
          full_name: fullName,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Complete profile error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * GET /api/auth/complete-profile
 * Checks if the authenticated user needs to complete their profile
 */
export async function GET() {
  try {
    const supabase = await createServerSupabaseClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user profile exists
    const { data: existingUser } = await supabase
      .from("users")
      .select("id, role, full_name")
      .eq("id", user.id)
      .single();

    if (existingUser) {
      return NextResponse.json(
        {
          profileCompleted: true,
          user: existingUser,
        },
        { status: 200 }
      );
    } else {
      return NextResponse.json(
        {
          profileCompleted: false,
          message:
            "Please complete your profile by calling POST /api/auth/complete-profile with role and fullName",
        },
        { status: 200 }
      );
    }
  } catch (error) {
    console.error("Check profile error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
