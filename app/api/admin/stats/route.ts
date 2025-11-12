import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/adminAuth";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

/**
 * GET /api/admin/stats
 *
 * Returns platform statistics for admin dashboard
 * Requires admin authentication
 *
 * Returns:
 * - User counts by role
 * - Professional verification status
 * - AI matching usage statistics
 * - Embedding generation status
 */
export async function GET() {
  // Verify admin authorization
  const authCheck = await requireAdmin();
  if (authCheck instanceof NextResponse) {
    return authCheck;
  }

  try {
    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      return NextResponse.json(
        { error: "Supabase configuration missing" },
        { status: 500 }
      );
    }

    // Create Supabase client with service role key (bypasses RLS)
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    // Fetch user counts by role
    const { data: users, error: usersError } = await supabase
      .from("users")
      .select("role");

    if (usersError) {
      console.error("Error fetching users:", usersError);
      throw usersError;
    }

    const userCounts = {
      total: users?.length || 0,
      clients: users?.filter((u) => u.role === "client").length || 0,
      trainers: users?.filter((u) => u.role === "trainer").length || 0,
      nutritionists:
        users?.filter((u) => u.role === "nutritionist").length || 0,
      admins: users?.filter((u) => u.role === "admin").length || 0,
    };

    // Fetch trainer stats
    const { data: trainers, error: trainersError } = await supabase
      .from("trainer_profiles")
      .select("is_verified, embedding");

    if (trainersError) {
      console.error("Error fetching trainers:", trainersError);
    }

    const trainerStats = {
      total: trainers?.length || 0,
      verified: trainers?.filter((t) => t.is_verified).length || 0,
      withEmbeddings: trainers?.filter((t) => t.embedding !== null).length || 0,
      needingEmbeddings:
        trainers?.filter((t) => t.is_verified && t.embedding === null).length ||
        0,
    };

    // Fetch nutritionist stats
    const { data: nutritionists, error: nutritionistsError } = await supabase
      .from("nutritionist_profiles")
      .select("is_verified, embedding");

    if (nutritionistsError) {
      console.error("Error fetching nutritionists:", nutritionistsError);
    }

    const nutritionistStats = {
      total: nutritionists?.length || 0,
      verified: nutritionists?.filter((n) => n.is_verified).length || 0,
      withEmbeddings:
        nutritionists?.filter((n) => n.embedding !== null).length || 0,
      needingEmbeddings:
        nutritionists?.filter((n) => n.is_verified && n.embedding === null)
          .length || 0,
    };

    // Fetch client onboarding stats
    const { data: clients, error: clientsError } = await supabase
      .from("client_profiles")
      .select("onboarding_data");

    if (clientsError) {
      console.error("Error fetching clients:", clientsError);
    }

    const clientStats = {
      total: clients?.length || 0,
      completedOnboarding:
        clients?.filter(
          (c) =>
            c.onboarding_data &&
            typeof c.onboarding_data === "object" &&
            Object.keys(c.onboarding_data).length > 0
        ).length || 0,
      pendingOnboarding:
        clients?.filter(
          (c) =>
            !c.onboarding_data ||
            typeof c.onboarding_data !== "object" ||
            Object.keys(c.onboarding_data).length === 0
        ).length || 0,
    };

    // Calculate completion rates
    const professionalStats = {
      trainers: trainerStats,
      nutritionists: nutritionistStats,
      embeddingCoverage: {
        trainers:
          trainerStats.verified > 0
            ? Math.round(
                (trainerStats.withEmbeddings / trainerStats.verified) * 100
              )
            : 0,
        nutritionists:
          nutritionistStats.verified > 0
            ? Math.round(
                (nutritionistStats.withEmbeddings /
                  nutritionistStats.verified) *
                  100
              )
            : 0,
      },
    };

    // Return comprehensive stats
    return NextResponse.json({
      timestamp: new Date().toISOString(),
      users: userCounts,
      clients: clientStats,
      professionals: professionalStats,
      aiMatching: {
        readyForMatching: clientStats.completedOnboarding,
        availableTrainers: trainerStats.withEmbeddings,
        availableNutritionists: nutritionistStats.withEmbeddings,
        potentialMatches:
          clientStats.completedOnboarding *
          (trainerStats.withEmbeddings + nutritionistStats.withEmbeddings),
      },
    });
  } catch (error) {
    console.error("Error in /api/admin/stats:", error);
    return NextResponse.json(
      {
        error: "Failed to fetch statistics",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
