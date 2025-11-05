import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabaseServer";

/**
 * POST /api/me/onboarding
 * Saves onboarding questionnaire data for a logged-in client
 * Only accessible to users with role 'client'
 */
export async function POST(request: Request) {
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

    // Check if the user is a client
    const { data: userData, error: userError } = await supabase
      .from("users")
      .select("role")
      .eq("id", user.id)
      .single();

    if (userError) {
      console.error("Error fetching user role:", userError);
      return NextResponse.json(
        { error: "Failed to verify user role" },
        { status: 500 }
      );
    }

    if (!userData || userData.role !== "client") {
      return NextResponse.json(
        { error: "Forbidden: Only clients can save onboarding data" },
        { status: 403 }
      );
    }

    // Parse the onboarding data from request body
    let onboardingData;
    try {
      onboardingData = await request.json();
    } catch {
      return NextResponse.json(
        { error: "Invalid JSON format in request body" },
        { status: 400 }
      );
    }

    // Validate that onboarding data is not empty
    if (!onboardingData || typeof onboardingData !== "object") {
      return NextResponse.json(
        { error: "Invalid onboarding data format" },
        { status: 400 }
      );
    }

    // Update the client_profiles table with the onboarding data
    const { error: updateError } = await supabase
      .from("client_profiles")
      .update({
        onboarding_data: onboardingData,
      })
      .eq("user_id", user.id);

    if (updateError) {
      console.error("Error updating onboarding data:", updateError);
      return NextResponse.json(
        { error: "Failed to save onboarding data" },
        { status: 500 }
      );
    }

    // Return success response
    return NextResponse.json(
      {
        message: "Onboarding data saved successfully",
        data: onboardingData,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error in /api/me/onboarding:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
