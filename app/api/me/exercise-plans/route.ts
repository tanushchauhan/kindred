import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabaseServer";

/**
 * GET /api/me/exercise-plans
 * Get exercise plans assigned to the authenticated client
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();

    // Authenticate user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Verify user is a client
    const { data: userData, error: userError } = await supabase
      .from("users")
      .select("role")
      .eq("id", user.id)
      .single();

    if (userError || !userData) {
      console.error("Error fetching user:", userError);
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (userData.role !== "client") {
      return NextResponse.json(
        { error: "Only clients can access this endpoint" },
        { status: 403 }
      );
    }

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const activeOnly = searchParams.get("active_only") === "true";
    const includeCompletions =
      searchParams.get("include_completions") === "true";

    // Build query
    let exerciseSelect = "*";
    if (includeCompletions) {
      exerciseSelect = `
        *,
        exercise_completions(*)
      `;
    }

    let query = supabase
      .from("exercise_plans")
      .select(
        `
        *,
        exercises(${exerciseSelect}),
        users!exercise_plans_trainer_id_fkey(id, full_name, user_name)
      `
      )
      .eq("client_id", user.id)
      .order("created_at", { ascending: false });

    // Apply filters
    if (activeOnly) {
      query = query.eq("is_active", true);
    }

    const { data: plans, error: plansError } = await query;

    if (plansError) {
      console.error("Error fetching exercise plans:", plansError);
      return NextResponse.json(
        { error: "Failed to fetch exercise plans" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      plans: plans || [],
      count: plans?.length || 0,
    });
  } catch (error) {
    console.error("Error in GET /api/me/exercise-plans:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
