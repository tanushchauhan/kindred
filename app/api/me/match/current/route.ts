import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabaseServer";

/**
 * GET /api/me/match/current
 *
 * Retrieve the client's current trainer and nutritionist matches
 *
 * Returns the professionals currently matched with the client,
 * including their full profiles (bio, specialties, contact info).
 */
export async function GET() {
  try {
    const supabase = await createServerSupabaseClient();

    // Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    // Verify user is a client
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

    if (userData.role !== "client") {
      return NextResponse.json(
        { error: "This feature is only available to clients" },
        { status: 403 }
      );
    }

    // Fetch the client's current matches
    const { data: match, error: matchError } = await supabase
      .from("client_matches")
      .select(
        `
        selected_trainer_id,
        selected_nutritionist_id,
        created_at,
        last_updated
      `
      )
      .eq("client_id", user.id)
      .single();

    if (matchError || !match) {
      return NextResponse.json(
        {
          error: "No matches found",
          message:
            "Use /api/me/match to get AI-powered matches or /api/me/match/update to set manual selections",
        },
        { status: 404 }
      );
    }

    // Fetch trainer details if assigned
    let trainer = null;
    if (match.selected_trainer_id) {
      const { data: trainerUser } = await supabase
        .from("users")
        .select("id, user_name, full_name, location")
        .eq("id", match.selected_trainer_id)
        .single();

      if (trainerUser) {
        const { data: trainerProfile } = await supabase
          .from("trainer_profiles")
          .select("bio, specialties, is_verified")
          .eq("user_id", match.selected_trainer_id)
          .single();

        if (trainerProfile) {
          trainer = {
            user_id: trainerUser.id,
            user_name: trainerUser.user_name,
            full_name: trainerUser.full_name,
            location: trainerUser.location,
            bio: trainerProfile.bio || "",
            specialties: trainerProfile.specialties || [],
            is_verified: trainerProfile.is_verified,
          };
        }
      }
    }

    // Fetch nutritionist details if assigned
    let nutritionist = null;
    if (match.selected_nutritionist_id) {
      const { data: nutritionistUser } = await supabase
        .from("users")
        .select("id, user_name, full_name, location")
        .eq("id", match.selected_nutritionist_id)
        .single();

      if (nutritionistUser) {
        const { data: nutritionistProfile } = await supabase
          .from("nutritionist_profiles")
          .select("bio, specialties, is_verified")
          .eq("user_id", match.selected_nutritionist_id)
          .single();

        if (nutritionistProfile) {
          nutritionist = {
            user_id: nutritionistUser.id,
            user_name: nutritionistUser.user_name,
            full_name: nutritionistUser.full_name,
            location: nutritionistUser.location,
            bio: nutritionistProfile.bio || "",
            specialties: nutritionistProfile.specialties || [],
            is_verified: nutritionistProfile.is_verified,
          };
        }
      }
    }

    return NextResponse.json({
      matches: {
        trainer,
        nutritionist,
      },
      metadata: {
        created_at: match.created_at,
        last_updated: match.last_updated,
      },
    });
  } catch (error) {
    console.error("Error fetching current matches:", error);
    return NextResponse.json(
      { error: "Failed to fetch current matches" },
      { status: 500 }
    );
  }
}
