import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabaseServer";
import { createClient } from "@supabase/supabase-js";
import { CreateExercisePlanRequest } from "@/lib/types";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

/**
 * PUT /api/professionals/exercise-plans/[planId]
 * Update an exercise plan
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ planId: string }> }
) {
  try {
    const { planId } = await params;
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

    // Verify user is a trainer
    const { data: userData, error: userError } = await adminSupabase
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
        { error: "Only trainers can update exercise plans" },
        { status: 403 }
      );
    }

    // Verify the plan exists and belongs to this trainer
    const { data: planData, error: planError } = await adminSupabase
      .from("exercise_plans")
      .select("id, trainer_id, client_id")
      .eq("id", planId)
      .single();

    if (planError || !planData) {
      return NextResponse.json(
        { error: "Exercise plan not found" },
        { status: 404 }
      );
    }

    if (planData.trainer_id !== user.id) {
      return NextResponse.json(
        { error: "You can only update your own exercise plans" },
        { status: 403 }
      );
    }

    // Parse request body
    const body: CreateExercisePlanRequest = await request.json();

    // Update the plan
    const { error: updateError } = await adminSupabase
      .from("exercise_plans")
      .update({
        title: body.title,
        description: body.description || null,
        start_date: body.start_date,
        end_date: body.end_date || null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", planId);

    if (updateError) {
      console.error("Error updating exercise plan:", updateError);
      return NextResponse.json(
        { error: "Failed to update exercise plan" },
        { status: 500 }
      );
    }

    // Delete existing exercises (and completions via CASCADE) and insert new ones
    await adminSupabase
      .from("exercises")
      .delete()
      .eq("exercise_plan_id", planId);

    if (body.exercises && body.exercises.length > 0) {
      const { error: exercisesError } = await adminSupabase
        .from("exercises")
        .insert(
          body.exercises.map((exercise) => ({
            exercise_plan_id: planId,
            name: exercise.name,
            description: exercise.description || null,
            sets: exercise.sets || null,
            reps: exercise.reps || null,
            duration_minutes: exercise.duration_minutes || null,
            scheduled_days: exercise.scheduled_days,
            notes: exercise.notes || null,
          }))
        );

      if (exercisesError) {
        console.error("Error inserting exercises:", exercisesError);
        return NextResponse.json(
          { error: "Failed to update exercises" },
          { status: 500 }
        );
      }
    }

    // Fetch updated plan with exercises
    const { data: updatedPlan, error: fetchError } = await adminSupabase
      .from("exercise_plans")
      .select(
        `
        *,
        exercises(*)
      `
      )
      .eq("id", planId)
      .single();

    if (fetchError) {
      console.error("Error fetching updated plan:", fetchError);
      return NextResponse.json(
        { error: "Failed to fetch updated plan" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: "Exercise plan updated successfully",
      plan: updatedPlan,
    });
  } catch (error) {
    console.error(
      "Error in PUT /api/professionals/exercise-plans/[planId]:",
      error
    );
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/professionals/exercise-plans/[planId]
 * Delete an exercise plan
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ planId: string }> }
) {
  try {
    const { planId } = await params;
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

    // Verify user is a trainer
    const { data: userData, error: userError } = await adminSupabase
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
        { error: "Only trainers can delete exercise plans" },
        { status: 403 }
      );
    }

    // Verify the plan exists and belongs to this trainer
    const { data: planData, error: planError } = await adminSupabase
      .from("exercise_plans")
      .select("id, trainer_id, client_id")
      .eq("id", planId)
      .single();

    if (planError || !planData) {
      return NextResponse.json(
        { error: "Exercise plan not found" },
        { status: 404 }
      );
    }

    if (planData.trainer_id !== user.id) {
      return NextResponse.json(
        { error: "You can only delete your own exercise plans" },
        { status: 403 }
      );
    }

    // Delete the plan (exercises and exercise_completions will be deleted automatically via CASCADE)
    const { error: deleteError } = await adminSupabase
      .from("exercise_plans")
      .delete()
      .eq("id", planId);

    if (deleteError) {
      console.error("Error deleting exercise plan:", deleteError);
      return NextResponse.json(
        { error: "Failed to delete exercise plan" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: "Exercise plan deleted successfully",
    });
  } catch (error) {
    console.error(
      "Error in DELETE /api/professionals/exercise-plans/[planId]:",
      error
    );
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
