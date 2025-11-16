import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabaseServer";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

/**
 * POST /api/me/exercise-completions
 * Mark an exercise as complete for today's date
 */
export async function POST(request: NextRequest) {
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
        { error: "Only clients can mark exercises as complete" },
        { status: 403 }
      );
    }

    // Parse request body
    const body = await request.json();

    // Validate required fields
    if (!body.exercise_id) {
      return NextResponse.json(
        { error: "Missing required field: exercise_id" },
        { status: 400 }
      );
    }

    // Use admin client to bypass RLS
    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      return NextResponse.json(
        { error: "Database configuration missing" },
        { status: 500 }
      );
    }

    const adminSupabase = createClient(
      SUPABASE_URL,
      SUPABASE_SERVICE_ROLE_KEY,
      {
        auth: { autoRefreshToken: false, persistSession: false },
      }
    );

    // Verify exercise exists and belongs to client's plan
    const { data: exerciseData, error: exerciseError } = await adminSupabase
      .from("exercises")
      .select(
        `
        id,
        exercise_plan_id,
        exercise_plans!inner(client_id)
      `
      )
      .eq("id", body.exercise_id)
      .single();

    if (exerciseError || !exerciseData) {
      return NextResponse.json(
        { error: "Exercise not found" },
        { status: 404 }
      );
    }

    const exercisePlan = exerciseData.exercise_plans as unknown as {
      client_id: string;
    };
    if (exercisePlan.client_id !== user.id) {
      return NextResponse.json(
        { error: "This exercise is not assigned to you" },
        { status: 403 }
      );
    }

    // Use today's date
    const now = new Date();
    const completionDate = now.toISOString().split("T")[0]; // YYYY-MM-DD format

    // Insert completion record
    const { data: completionData, error: completionError } = await adminSupabase
      .from("exercise_completions")
      .insert({
        exercise_id: body.exercise_id,
        client_id: user.id,
        completion_date: completionDate,
        completed: true,
        notes: body.notes || null,
      })
      .select()
      .single();

    if (completionError) {
      console.error("Error marking exercise complete:", completionError);
      return NextResponse.json(
        { error: "Failed to mark exercise as complete" },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        message: "Exercise marked as complete",
        completion: completionData,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error in POST /api/me/exercise-completions:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * GET /api/me/exercise-completions
 * Get exercise completions for the authenticated client
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

    // Use admin client to bypass RLS
    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      return NextResponse.json(
        { error: "Database configuration missing" },
        { status: 500 }
      );
    }

    const adminSupabase = createClient(
      SUPABASE_URL,
      SUPABASE_SERVICE_ROLE_KEY,
      {
        auth: { autoRefreshToken: false, persistSession: false },
      }
    );

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const exerciseId = searchParams.get("exercise_id");
    const startDate = searchParams.get("start_date");
    const endDate = searchParams.get("end_date");

    // Build query
    let query = adminSupabase
      .from("exercise_completions")
      .select(
        `
        *,
        exercises(
          id,
          name,
          exercise_plan_id
        )
      `
      )
      .eq("client_id", user.id)
      .order("completion_date", { ascending: false });

    // Apply filters
    if (exerciseId) {
      query = query.eq("exercise_id", exerciseId);
    }

    if (startDate) {
      query = query.gte("completion_date", startDate);
    }

    if (endDate) {
      query = query.lte("completion_date", endDate);
    }

    const { data: completions, error: completionsError } = await query;

    if (completionsError) {
      console.error("Error fetching exercise completions:", completionsError);
      return NextResponse.json(
        { error: "Failed to fetch exercise completions" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      completions: completions || [],
      count: completions?.length || 0,
    });
  } catch (error) {
    console.error("Error in GET /api/me/exercise-completions:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/me/exercise-completions
 * Delete an exercise completion
 */
export async function DELETE(request: NextRequest) {
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

    // Use admin client to bypass RLS
    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      return NextResponse.json(
        { error: "Database configuration missing" },
        { status: 500 }
      );
    }

    const adminSupabase = createClient(
      SUPABASE_URL,
      SUPABASE_SERVICE_ROLE_KEY,
      {
        auth: { autoRefreshToken: false, persistSession: false },
      }
    );

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const completionId = searchParams.get("id");

    if (!completionId) {
      return NextResponse.json(
        { error: "Missing required parameter: id" },
        { status: 400 }
      );
    }

    // Delete completion (verify ownership)
    const { error: deleteError } = await adminSupabase
      .from("exercise_completions")
      .delete()
      .eq("id", completionId)
      .eq("client_id", user.id);

    if (deleteError) {
      console.error("Error deleting exercise completion:", deleteError);
      return NextResponse.json(
        { error: "Failed to delete exercise completion" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: "Exercise completion deleted successfully",
    });
  } catch (error) {
    console.error("Error in DELETE /api/me/exercise-completions:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
