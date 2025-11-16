import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabaseServer";
import { CreateExercisePlanRequest } from "@/lib/types";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

/**
 * POST /api/professionals/exercise-plans
 * Create a new exercise plan with exercises
 * Only trainers can create plans for their matched clients
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

    // Verify user is a trainer (use admin client to bypass RLS)
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

    const { data: userData, error: userError } = await adminSupabase
      .from("users")
      .select("role, trainer_profiles!inner(is_verified)")
      .eq("id", user.id)
      .single();

    if (userError || !userData) {
      console.error("Error fetching user:", userError);
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (userData.role !== "trainer") {
      return NextResponse.json(
        { error: "Only trainers can create exercise plans" },
        { status: 403 }
      );
    }

    const trainerProfiles = userData.trainer_profiles as
      | { is_verified?: boolean }
      | Array<{ is_verified?: boolean }>
      | undefined;

    const isVerifiedFlag = Array.isArray(trainerProfiles)
      ? !!trainerProfiles[0]?.is_verified
      : !!trainerProfiles?.is_verified;

    if (!isVerifiedFlag) {
      return NextResponse.json(
        { error: "Only verified trainers can create plans" },
        { status: 403 }
      );
    }

    // Parse request body
    const body: CreateExercisePlanRequest = await request.json();

    // Validate required fields
    if (
      !body.client_id ||
      !body.title ||
      !body.start_date ||
      !body.exercises ||
      body.exercises.length === 0
    ) {
      return NextResponse.json(
        {
          error:
            "Missing required fields: client_id, title, start_date, exercises",
        },
        { status: 400 }
      );
    }

    // Validate exercises
    for (const exercise of body.exercises) {
      if (
        !exercise.name ||
        !exercise.scheduled_days ||
        exercise.scheduled_days.length === 0
      ) {
        return NextResponse.json(
          {
            error:
              "Each exercise must have a name and at least one scheduled day",
          },
          { status: 400 }
        );
      }

      // Validate scheduled_days array
      if (exercise.scheduled_days.some((day) => day < 0 || day > 6)) {
        return NextResponse.json(
          {
            error: "scheduled_days must be between 0 (Sunday) and 6 (Saturday)",
          },
          { status: 400 }
        );
      }
    }

    // Verify client exists and is matched with this trainer
    const { data: matchData, error: matchError } = await adminSupabase
      .from("client_matches")
      .select("id, client_id, selected_trainer_id")
      .eq("client_id", body.client_id)
      .eq("selected_trainer_id", user.id)
      .single();

    if (matchError || !matchData) {
      return NextResponse.json(
        { error: "Client not found or not matched with you" },
        { status: 403 }
      );
    }

    // Deactivate previous active plans for this client (only one active plan at a time)
    const { error: deactivateError } = await adminSupabase
      .from("exercise_plans")
      .update({ is_active: false })
      .eq("client_id", body.client_id)
      .eq("trainer_id", user.id)
      .eq("is_active", true);

    if (deactivateError) {
      console.error("Error deactivating previous plans:", deactivateError);
    }

    // Create exercise plan
    const { data: planData, error: planError } = await adminSupabase
      .from("exercise_plans")
      .insert({
        trainer_id: user.id,
        client_id: body.client_id,
        title: body.title,
        description: body.description || null,
        start_date: body.start_date,
        end_date: body.end_date || null,
        is_active: true,
      })
      .select()
      .single();

    if (planError || !planData) {
      console.error("Error creating exercise plan:", planError);
      return NextResponse.json(
        { error: "Failed to create exercise plan" },
        { status: 500 }
      );
    }

    // Create exercises
    const exercisesToInsert = body.exercises.map((exercise) => ({
      exercise_plan_id: planData.id,
      name: exercise.name,
      description: exercise.description || null,
      sets: exercise.sets || null,
      reps: exercise.reps || null,
      duration_minutes: exercise.duration_minutes || null,
      scheduled_days: exercise.scheduled_days,
      notes: exercise.notes || null,
    }));

    const { data: exercisesData, error: exercisesError } = await adminSupabase
      .from("exercises")
      .insert(exercisesToInsert)
      .select();

    if (exercisesError) {
      console.error("Error creating exercises:", exercisesError);
      // Rollback: delete the plan
      await adminSupabase.from("exercise_plans").delete().eq("id", planData.id);
      return NextResponse.json(
        { error: "Failed to create exercises" },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        message: "Exercise plan created successfully",
        plan: {
          ...planData,
          exercises: exercisesData,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error in POST /api/professionals/exercise-plans:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * GET /api/professionals/exercise-plans
 * Get all exercise plans created by this trainer
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

    // Create admin client to bypass RLS for data queries
    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      return NextResponse.json(
        { error: "Database configuration missing" },
        { status: 500 }
      );
    }

    // Verify user is a trainer
    const { data: userData, error: userError } = await supabase
      .from("users")
      .select("role")
      .eq("id", user.id)
      .single();

    if (userError || !userData) {
      console.error("Error fetching user:", userError);
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (userData.role !== "trainer") {
      return NextResponse.json(
        { error: "Only trainers can access this endpoint" },
        { status: 403 }
      );
    }

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const clientId = searchParams.get("client_id");
    const activeOnly = searchParams.get("active_only") === "true";

    // Build query
    let query = supabase
      .from("exercise_plans")
      .select(
        `
        *,
        exercises(*),
        users!exercise_plans_client_id_fkey(id, full_name, user_name)
      `
      )
      .eq("trainer_id", user.id)
      .order("created_at", { ascending: false });

    // Apply filters
    if (clientId) {
      query = query.eq("client_id", clientId);
    }

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
    console.error("Error in GET /api/professionals/exercise-plans:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/professionals/exercise-plans
 * Update an existing exercise plan
 */
export async function PUT(request: NextRequest) {
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

    // Create admin client to bypass RLS for data queries
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

    // Parse request body
    const body = await request.json();
    const { plan_id, title, description, end_date, is_active, exercises } =
      body;

    if (!plan_id) {
      return NextResponse.json(
        { error: "Missing required field: plan_id" },
        { status: 400 }
      );
    }

    // Verify trainer owns this plan
    const { data: planData, error: planError } = await supabase
      .from("exercise_plans")
      .select("id, trainer_id, client_id")
      .eq("id", plan_id)
      .eq("trainer_id", user.id)
      .single();

    if (planError || !planData) {
      return NextResponse.json(
        { error: "Plan not found or you don't have permission" },
        { status: 404 }
      );
    }

    // Update plan fields
    const updateData: Record<string, unknown> = {};
    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (end_date !== undefined) updateData.end_date = end_date;
    if (is_active !== undefined) updateData.is_active = is_active;

    if (Object.keys(updateData).length > 0) {
      const { error: updateError } = await supabase
        .from("exercise_plans")
        .update(updateData)
        .eq("id", plan_id);

      if (updateError) {
        console.error("Error updating exercise plan:", updateError);
        return NextResponse.json(
          { error: "Failed to update exercise plan" },
          { status: 500 }
        );
      }
    }

    // Update exercises if provided
    if (exercises && Array.isArray(exercises)) {
      // Delete existing exercises
      const { error: deleteError } = await supabase
        .from("exercises")
        .delete()
        .eq("exercise_plan_id", plan_id);

      if (deleteError) {
        console.error("Error deleting exercises:", deleteError);
        return NextResponse.json(
          { error: "Failed to update exercises" },
          { status: 500 }
        );
      }

      // Insert new exercises
      if (exercises.length > 0) {
        const exercisesToInsert = exercises.map(
          (exercise: {
            name: string;
            description?: string;
            sets?: number;
            reps?: number;
            duration_minutes?: number;
            scheduled_days: number[];
            notes?: string;
          }) => ({
            exercise_plan_id: plan_id,
            name: exercise.name,
            description: exercise.description || null,
            sets: exercise.sets || null,
            reps: exercise.reps || null,
            duration_minutes: exercise.duration_minutes || null,
            scheduled_days: exercise.scheduled_days,
            notes: exercise.notes || null,
          })
        );

        const { error: insertError } = await supabase
          .from("exercises")
          .insert(exercisesToInsert);

        if (insertError) {
          console.error("Error inserting exercises:", insertError);
          return NextResponse.json(
            { error: "Failed to update exercises" },
            { status: 500 }
          );
        }
      }
    }

    // Fetch updated plan
    const { data: updatedPlan, error: fetchError } = await adminSupabase
      .from("exercise_plans")
      .select(
        `
        *,
        exercises(*)
      `
      )
      .eq("id", plan_id)
      .single();

    if (fetchError) {
      console.error("Error fetching updated plan:", fetchError);
      return NextResponse.json(
        { error: "Plan updated but failed to fetch updated data" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: "Exercise plan updated successfully",
      plan: updatedPlan,
    });
  } catch (error) {
    console.error("Error in PUT /api/professionals/exercise-plans:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
