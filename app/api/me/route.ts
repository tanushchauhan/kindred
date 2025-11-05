import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabaseServer";

/**
 * GET /api/me
 * Fetches the complete profile of the currently authenticated user
 * Includes role-specific profile data via JOIN
 */
export async function GET() {
  try {
    // Create server-side Supabase client with cookie access
    const supabase = await createServerSupabaseClient();

    // Get the authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // First, get the user's role from the users table
    const { data: userData, error: userError } = await supabase
      .from("users")
      .select("role")
      .eq("id", user.id)
      .single();

    if (userError || !userData) {
      return NextResponse.json(
        { error: "User profile not found" },
        { status: 404 }
      );
    }

    const { role } = userData;

    // Based on role, fetch the complete profile with JOIN
    let profileData;
    let profileError;

    if (role === "client") {
      const { data, error } = await supabase
        .from("users")
        .select(
          `
          *,
          client_profiles (*)
        `
        )
        .eq("id", user.id)
        .single();

      profileData = data;
      profileError = error;
    } else if (role === "trainer") {
      const { data, error } = await supabase
        .from("users")
        .select(
          `
          *,
          trainer_profiles (*)
        `
        )
        .eq("id", user.id)
        .single();

      profileData = data;
      profileError = error;
    } else if (role === "nutritionist") {
      const { data, error } = await supabase
        .from("users")
        .select(
          `
          *,
          nutritionist_profiles (*)
        `
        )
        .eq("id", user.id)
        .single();

      profileData = data;
      profileError = error;
    } else {
      return NextResponse.json({ error: "Invalid user role" }, { status: 400 });
    }

    if (profileError) {
      console.error("Error fetching profile:", profileError);
      return NextResponse.json(
        { error: "Failed to fetch user profile" },
        { status: 500 }
      );
    }

    if (!profileData) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    // Return the complete profile data
    return NextResponse.json(profileData, { status: 200 });
  } catch (error) {
    console.error("Error in /api/me:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
