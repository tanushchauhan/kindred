import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabaseServer";

/**
 * PUT /api/professionals/onboarding
 *
 * Allows verified trainers and nutritionists to complete their professional onboarding
 * by adding their bio and specialties.
 *
 * Request body:
 * {
 *   bio: string,
 *   specialties: string[]
 * }
 */
export async function PUT(request: NextRequest) {
  const supabase = await createServerSupabaseClient();

  try {
    // Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    // Get user profile to check role and verification status
    const { data: userProfile, error: profileError } = await supabase
      .from("users")
      .select("role")
      .eq("id", user.id)
      .single();

    if (profileError || !userProfile) {
      return NextResponse.json(
        { error: "User profile not found" },
        { status: 404 }
      );
    }

    const role = userProfile.role;

    // Only trainers and nutritionists can use this endpoint
    if (role !== "trainer" && role !== "nutritionist") {
      return NextResponse.json(
        { error: "This endpoint is only for trainers and nutritionists" },
        { status: 403 }
      );
    }

    // Parse request body
    const body = await request.json();
    const { bio, specialties } = body;

    // Validate input
    if (!bio || typeof bio !== "string" || bio.trim().length === 0) {
      return NextResponse.json(
        { error: "Bio is required and must be a non-empty string" },
        { status: 400 }
      );
    }

    if (!Array.isArray(specialties) || specialties.length === 0) {
      return NextResponse.json(
        { error: "At least one specialty is required" },
        { status: 400 }
      );
    }

    // Validate specialties are strings
    if (!specialties.every((s) => typeof s === "string")) {
      return NextResponse.json(
        { error: "All specialties must be strings" },
        { status: 400 }
      );
    }

    // Check if profile exists and is verified
    const tableName =
      role === "trainer" ? "trainer_profiles" : "nutritionist_profiles";

    const { data: existingProfile, error: checkError } = await supabase
      .from(tableName)
      .select("is_verified")
      .eq("user_id", user.id)
      .single();

    if (checkError || !existingProfile) {
      return NextResponse.json(
        { error: "Professional profile not found" },
        { status: 404 }
      );
    }

    if (!existingProfile.is_verified) {
      return NextResponse.json(
        { error: "Your account must be verified before completing onboarding" },
        { status: 403 }
      );
    }

    // Update the profile with bio and specialties
    const { data: updatedProfile, error: updateError } = await supabase
      .from(tableName)
      .update({
        bio: bio.trim(),
        specialties: specialties,
      })
      .eq("user_id", user.id)
      .select()
      .single();

    if (updateError) {
      console.error("Error updating professional profile:", updateError);
      return NextResponse.json(
        { error: "Failed to update profile" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: "Professional onboarding completed successfully",
      profile: updatedProfile,
    });
  } catch (error) {
    console.error("Unexpected error during professional onboarding:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}

/**
 * GET /api/professionals/onboarding
 *
 * Get the current professional's onboarding status and profile
 */
export async function GET() {
  const supabase = await createServerSupabaseClient();

  try {
    // Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    // Get user profile to check role
    const { data: userProfile, error: profileError } = await supabase
      .from("users")
      .select("role")
      .eq("id", user.id)
      .single();

    if (profileError || !userProfile) {
      return NextResponse.json(
        { error: "User profile not found" },
        { status: 404 }
      );
    }

    const role = userProfile.role;

    // Only trainers and nutritionists can use this endpoint
    if (role !== "trainer" && role !== "nutritionist") {
      return NextResponse.json(
        { error: "This endpoint is only for trainers and nutritionists" },
        { status: 403 }
      );
    }

    // Get professional profile
    const tableName =
      role === "trainer" ? "trainer_profiles" : "nutritionist_profiles";

    const { data: profile, error: fetchError } = await supabase
      .from(tableName)
      .select("*")
      .eq("user_id", user.id)
      .single();

    if (fetchError || !profile) {
      return NextResponse.json(
        { error: "Professional profile not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      role,
      profile,
      isVerified: profile.is_verified,
      hasCompletedOnboarding: !!(
        profile.bio && profile.specialties?.length > 0
      ),
    });
  } catch (error) {
    console.error("Unexpected error fetching professional profile:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}
