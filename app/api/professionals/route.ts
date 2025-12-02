import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabaseServer";

/**
 * GET /api/professionals
 * Fetch all verified professionals (trainers and nutritionists)
 * Public endpoint - no authentication required
 */
export async function GET() {
  try {
    const supabase = await createServerSupabaseClient();

    // Fetch verified trainers
    const { data: trainers, error: trainersError } = await supabase
      .from("users")
      .select(
        `
        id,
        full_name,
        user_name,
        location,
        profile_image_url,
        trainer_profiles!inner (
          bio,
          specialties,
          is_verified
        )
      `
      )
      .eq("role", "trainer")
      .eq("trainer_profiles.is_verified", true)
      .not("trainer_profiles.bio", "is", null)
      .order("full_name");

    if (trainersError) {
      console.error("Error fetching trainers:", trainersError);
    }

    // Fetch verified nutritionists
    const { data: nutritionists, error: nutritionistsError } = await supabase
      .from("users")
      .select(
        `
        id,
        full_name,
        user_name,
        location,
        profile_image_url,
        nutritionist_profiles!inner (
          bio,
          specialties,
          is_verified
        )
      `
      )
      .eq("role", "nutritionist")
      .eq("nutritionist_profiles.is_verified", true)
      .not("nutritionist_profiles.bio", "is", null)
      .order("full_name");

    if (nutritionistsError) {
      console.error("Error fetching nutritionists:", nutritionistsError);
    }

    return NextResponse.json({
      trainers: trainers || [],
      nutritionists: nutritionists || [],
    });
  } catch (error) {
    console.error("Error in /api/professionals:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
