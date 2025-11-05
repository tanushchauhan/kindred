import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabaseServer";

/**
 * GET /api/professionals/[username]
 * Fetch a single professional by username
 * Public endpoint - no authentication required
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { username: string } }
) {
  try {
    const { username } = await params;

    if (!username) {
      return NextResponse.json(
        { error: "Username is required" },
        { status: 400 }
      );
    }

    const supabase = await createServerSupabaseClient();

    // First, find the user by username
    const { data: user, error: userError } = await supabase
      .from("users")
      .select("id, role, full_name, user_name, location")
      .eq("user_name", username)
      .single();

    if (userError || !user) {
      return NextResponse.json(
        { error: "Professional not found" },
        { status: 404 }
      );
    }

    // Fetch role-specific profile based on role
    let profileData = null;

    if (user.role === "trainer") {
      const { data, error } = await supabase
        .from("trainer_profiles")
        .select("bio, specialties, is_verified")
        .eq("user_id", user.id)
        .eq("is_verified", true)
        .single();

      if (error || !data) {
        return NextResponse.json(
          { error: "Professional profile not found or not verified" },
          { status: 404 }
        );
      }

      profileData = data;
    } else if (user.role === "nutritionist") {
      const { data, error } = await supabase
        .from("nutritionist_profiles")
        .select("bio, specialties, is_verified")
        .eq("user_id", user.id)
        .eq("is_verified", true)
        .single();

      if (error || !data) {
        return NextResponse.json(
          { error: "Professional profile not found or not verified" },
          { status: 404 }
        );
      }

      profileData = data;
    } else {
      return NextResponse.json(
        { error: "User is not a professional" },
        { status: 404 }
      );
    }

    // Check if profile is complete (has bio)
    if (!profileData.bio) {
      return NextResponse.json(
        { error: "Professional profile is not complete" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      ...user,
      profile: profileData,
    });
  } catch (error) {
    console.error("Error fetching professional:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
