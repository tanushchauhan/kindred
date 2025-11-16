import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabaseServer";
import { createClient } from "@supabase/supabase-js";
import { CreateNutritionPlanRequest } from "@/lib/types";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

/**
 * PUT /api/professionals/nutrition-plans/[planId]
 * Update a nutrition plan
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

    // Verify user is a nutritionist
    const { data: userData, error: userError } = await adminSupabase
      .from("users")
      .select("role")
      .eq("id", user.id)
      .single();

    if (userError || !userData) {
      console.error("Error fetching user:", userError);
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (userData.role !== "nutritionist") {
      return NextResponse.json(
        { error: "Only nutritionists can update nutrition plans" },
        { status: 403 }
      );
    }

    // Verify the plan exists and belongs to this nutritionist
    const { data: planData, error: planError } = await adminSupabase
      .from("nutrition_plans")
      .select("id, nutritionist_id, client_id")
      .eq("id", planId)
      .single();

    if (planError || !planData) {
      return NextResponse.json(
        { error: "Nutrition plan not found" },
        { status: 404 }
      );
    }

    if (planData.nutritionist_id !== user.id) {
      return NextResponse.json(
        { error: "You can only update your own nutrition plans" },
        { status: 403 }
      );
    }

    // Parse request body
    const body: CreateNutritionPlanRequest = await request.json();

    // Update the plan
    const { error: updateError } = await adminSupabase
      .from("nutrition_plans")
      .update({
        title: body.title,
        description: body.description || null,
        start_date: body.start_date,
        end_date: body.end_date || null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", planId);

    if (updateError) {
      console.error("Error updating nutrition plan:", updateError);
      return NextResponse.json(
        { error: "Failed to update nutrition plan" },
        { status: 500 }
      );
    }

    // Delete existing macro goals and insert new ones
    await adminSupabase
      .from("macro_goals")
      .delete()
      .eq("nutrition_plan_id", planId);

    if (body.macro_goals && body.macro_goals.length > 0) {
      const { error: goalsError } = await adminSupabase
        .from("macro_goals")
        .insert(
          body.macro_goals.map((goal) => ({
            nutrition_plan_id: planId,
            goal_type: goal.goal_type,
            target_amount: goal.target_amount,
            unit: goal.unit,
            notes: goal.notes || null,
          }))
        );

      if (goalsError) {
        console.error("Error inserting macro goals:", goalsError);
        return NextResponse.json(
          { error: "Failed to update macro goals" },
          { status: 500 }
        );
      }
    }

    // Fetch updated plan with goals
    const { data: updatedPlan, error: fetchError } = await adminSupabase
      .from("nutrition_plans")
      .select(
        `
        *,
        macro_goals(*)
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
      message: "Nutrition plan updated successfully",
      plan: updatedPlan,
    });
  } catch (error) {
    console.error(
      "Error in PUT /api/professionals/nutrition-plans/[planId]:",
      error
    );
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/professionals/nutrition-plans/[planId]
 * Delete a nutrition plan
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

    // Verify user is a nutritionist
    const { data: userData, error: userError } = await adminSupabase
      .from("users")
      .select("role")
      .eq("id", user.id)
      .single();

    if (userError || !userData) {
      console.error("Error fetching user:", userError);
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (userData.role !== "nutritionist") {
      return NextResponse.json(
        { error: "Only nutritionists can delete nutrition plans" },
        { status: 403 }
      );
    }

    // Verify the plan exists and belongs to this nutritionist
    const { data: planData, error: planError } = await adminSupabase
      .from("nutrition_plans")
      .select("id, nutritionist_id, client_id")
      .eq("id", planId)
      .single();

    if (planError || !planData) {
      return NextResponse.json(
        { error: "Nutrition plan not found" },
        { status: 404 }
      );
    }

    if (planData.nutritionist_id !== user.id) {
      return NextResponse.json(
        { error: "You can only delete your own nutrition plans" },
        { status: 403 }
      );
    }

    // Delete the plan (macro_goals will be deleted automatically via CASCADE)
    const { error: deleteError } = await adminSupabase
      .from("nutrition_plans")
      .delete()
      .eq("id", planId);

    if (deleteError) {
      console.error("Error deleting nutrition plan:", deleteError);
      return NextResponse.json(
        { error: "Failed to delete nutrition plan" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: "Nutrition plan deleted successfully",
    });
  } catch (error) {
    console.error(
      "Error in DELETE /api/professionals/nutrition-plans/[planId]:",
      error
    );
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
