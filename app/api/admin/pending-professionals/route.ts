import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/adminAuth";

/**
 * GET /api/admin/pending-professionals
 * Get list of professionals pending verification with their reason for joining
 */
export async function GET() {
  // Check admin authorization
  const authCheck = await requireAdmin();
  if (authCheck instanceof NextResponse) {
    return authCheck;
  }

  try {
    // Use service role to bypass RLS for admin access
    const { createClient } = await import("@supabase/supabase-js");
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );

    // Get pending trainers
    const { data: trainers, error: trainersError } = await supabaseAdmin
      .from("trainer_profiles")
      .select(
        `
        user_id,
        bio,
        specialties,
        is_verified,
        reason_for_joining,
        users (
          full_name,
          user_name,
          phone_number,
          location,
          profile_image_url,
          created_at
        )
      `
      )
      .eq("is_verified", false)
      .not("reason_for_joining", "is", null);

    if (trainersError) {
      console.error("Error fetching trainers:", trainersError);
      return NextResponse.json(
        { error: "Failed to fetch trainers" },
        { status: 500 }
      );
    }

    // Get pending nutritionists
    const { data: nutritionists, error: nutritionistsError } =
      await supabaseAdmin
        .from("nutritionist_profiles")
        .select(
          `
        user_id,
        bio,
        specialties,
        is_verified,
        reason_for_joining,
        users (
          full_name,
          user_name,
          phone_number,
          location,
          profile_image_url,
          created_at
        )
      `
        )
        .eq("is_verified", false)
        .not("reason_for_joining", "is", null);

    if (nutritionistsError) {
      console.error("Error fetching nutritionists:", nutritionistsError);
      return NextResponse.json(
        { error: "Failed to fetch nutritionists" },
        { status: 500 }
      );
    }

    // Get email for each user from auth.users table
    const { data: authUsers } = await supabaseAdmin.auth.admin.listUsers();

    const emailMap = new Map(
      authUsers.users.map((user) => [user.id, user.email])
    );

    // Format trainers with email
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const formattedTrainers = (trainers || []).map((trainer: any) => ({
      user_id: trainer.user_id,
      role: "trainer" as const,
      full_name: trainer.users?.full_name || "N/A",
      user_name: trainer.users?.user_name || "N/A",
      email: emailMap.get(trainer.user_id) || "N/A",
      phone_number: trainer.users?.phone_number || "N/A",
      location: trainer.users?.location || "N/A",
      bio: trainer.bio,
      specialties: trainer.specialties || [],
      reason_for_joining: trainer.reason_for_joining,
      created_at: trainer.users?.created_at,
      is_verified: trainer.is_verified,
    }));

    // Format nutritionists with email
    const formattedNutritionists = (nutritionists || []).map(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (nutritionist: any) => ({
        user_id: nutritionist.user_id,
        role: "nutritionist" as const,
        full_name: nutritionist.users?.full_name || "N/A",
        user_name: nutritionist.users?.user_name || "N/A",
        email: emailMap.get(nutritionist.user_id) || "N/A",
        phone_number: nutritionist.users?.phone_number || "N/A",
        location: nutritionist.users?.location || "N/A",
        bio: nutritionist.bio,
        specialties: nutritionist.specialties || [],
        reason_for_joining: nutritionist.reason_for_joining,
        created_at: nutritionist.users?.created_at,
        is_verified: nutritionist.is_verified,
      })
    );

    return NextResponse.json({
      trainers: formattedTrainers,
      nutritionists: formattedNutritionists,
      total: formattedTrainers.length + formattedNutritionists.length,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error in pending-professionals:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
