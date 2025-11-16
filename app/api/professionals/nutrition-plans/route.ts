import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabaseServer";
import { CreateNutritionPlanRequest } from "@/lib/types";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

/**
 * POST /api/professionals/nutrition-plans
 * Create a new nutrition plan with macro goals
 * Only nutritionists can create plans for their matched clients
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

    // Verify user is a nutritionist (use admin client to bypass RLS)
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
      .select("role, nutritionist_profiles!inner(is_verified)")
      .eq("id", user.id)
      .single();

    if (userError || !userData) {
      console.error("Error fetching user:", userError);
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (userData.role !== "nutritionist") {
      return NextResponse.json(
        { error: "Only nutritionists can create nutrition plans" },
        { status: 403 }
      );
    }

    const nutritionistProfiles = userData.nutritionist_profiles as
      | { is_verified?: boolean }
      | Array<{ is_verified?: boolean }>
      | undefined;

    const isVerifiedFlag = Array.isArray(nutritionistProfiles)
      ? !!nutritionistProfiles[0]?.is_verified
      : !!nutritionistProfiles?.is_verified;

    if (!isVerifiedFlag) {
      return NextResponse.json(
        { error: "Only verified nutritionists can create plans" },
        { status: 403 }
      );
    }

    // Parse request body
    const body: CreateNutritionPlanRequest = await request.json();

    // Validate required fields
    if (
      !body.client_id ||
      !body.title ||
      !body.start_date ||
      !body.macro_goals ||
      body.macro_goals.length === 0
    ) {
      return NextResponse.json(
        {
          error:
            "Missing required fields: client_id, title, start_date, macro_goals",
        },
        { status: 400 }
      );
    }

    // Verify client exists and is matched with this nutritionist
    const { data: matchData, error: matchError } = await adminSupabase
      .from("client_matches")
      .select("id, client_id, selected_nutritionist_id")
      .eq("client_id", body.client_id)
      .eq("selected_nutritionist_id", user.id)
      .single();

    if (matchError || !matchData) {
      console.log(body, user.id);
      return NextResponse.json(
        { error: "Client not found or not matched with you" },
        { status: 403 }
      );
    }

    // Deactivate previous active plans for this client (only one active plan at a time)
    const { error: deactivateError } = await adminSupabase
      .from("nutrition_plans")
      .update({ is_active: false })
      .eq("client_id", body.client_id)
      .eq("nutritionist_id", user.id)
      .eq("is_active", true);

    if (deactivateError) {
      console.error("Error deactivating previous plans:", deactivateError);
    }

    // Create nutrition plan
    const { data: planData, error: planError } = await adminSupabase
      .from("nutrition_plans")
      .insert({
        nutritionist_id: user.id,
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
      console.error("Error creating nutrition plan:", planError);
      return NextResponse.json(
        { error: "Failed to create nutrition plan" },
        { status: 500 }
      );
    }

    // Create macro goals
    const macroGoalsToInsert = body.macro_goals.map((goal) => ({
      nutrition_plan_id: planData.id,
      goal_type: goal.goal_type,
      target_amount: goal.target_amount,
      unit: goal.unit,
      notes: goal.notes || null,
    }));

    const { data: goalsData, error: goalsError } = await adminSupabase
      .from("macro_goals")
      .insert(macroGoalsToInsert)
      .select();

    if (goalsError) {
      console.error("Error creating macro goals:", goalsError);
      // Rollback: delete the plan
      await adminSupabase
        .from("nutrition_plans")
        .delete()
        .eq("id", planData.id);
      return NextResponse.json(
        { error: "Failed to create macro goals" },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        message: "Nutrition plan created successfully",
        plan: {
          ...planData,
          macro_goals: goalsData,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error in POST /api/professionals/nutrition-plans:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * GET /api/professionals/nutrition-plans
 * Get all nutrition plans created by this nutritionist
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

    // Verify user is a nutritionist
    const { data: userData, error: userError } = await supabase
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
        { error: "Only nutritionists can access this endpoint" },
        { status: 403 }
      );
    }

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const clientId = searchParams.get("client_id");
    const activeOnly = searchParams.get("active_only") === "true";

    // Build query
    let query = supabase
      .from("nutrition_plans")
      .select(
        `
        *,
        macro_goals(*),
        users!nutrition_plans_client_id_fkey(id, full_name, user_name)
      `
      )
      .eq("nutritionist_id", user.id)
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
      console.error("Error fetching nutrition plans:", plansError);
      return NextResponse.json(
        { error: "Failed to fetch nutrition plans" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      plans: plans || [],
      count: plans?.length || 0,
    });
  } catch (error) {
    console.error("Error in GET /api/professionals/nutrition-plans:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/professionals/nutrition-plans
 * Update an existing nutrition plan
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

    // Parse request body
    const body = await request.json();
    const { plan_id, title, description, end_date, is_active, macro_goals } =
      body;

    if (!plan_id) {
      return NextResponse.json(
        { error: "Missing required field: plan_id" },
        { status: 400 }
      );
    }

    // Verify nutritionist owns this plan
    const { data: planData, error: planError } = await supabase
      .from("nutrition_plans")
      .select("id, nutritionist_id, client_id")
      .eq("id", plan_id)
      .eq("nutritionist_id", user.id)
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
        .from("nutrition_plans")
        .update(updateData)
        .eq("id", plan_id);

      if (updateError) {
        console.error("Error updating nutrition plan:", updateError);
        return NextResponse.json(
          { error: "Failed to update nutrition plan" },
          { status: 500 }
        );
      }
    }

    // Update macro goals if provided
    if (macro_goals && Array.isArray(macro_goals)) {
      // Delete existing goals
      const { error: deleteError } = await supabase
        .from("macro_goals")
        .delete()
        .eq("nutrition_plan_id", plan_id);

      if (deleteError) {
        console.error("Error deleting macro goals:", deleteError);
        return NextResponse.json(
          { error: "Failed to update macro goals" },
          { status: 500 }
        );
      }

      // Insert new goals
      if (macro_goals.length > 0) {
        const macroGoalsToInsert = macro_goals.map(
          (goal: {
            goal_type: string;
            target_amount: number;
            unit: string;
            notes?: string;
          }) => ({
            nutrition_plan_id: plan_id,
            goal_type: goal.goal_type,
            target_amount: goal.target_amount,
            unit: goal.unit,
            notes: goal.notes || null,
          })
        );

        const { error: insertError } = await supabase
          .from("macro_goals")
          .insert(macroGoalsToInsert);

        if (insertError) {
          console.error("Error inserting macro goals:", insertError);
          return NextResponse.json(
            { error: "Failed to update macro goals" },
            { status: 500 }
          );
        }
      }
    }

    // Fetch updated plan
    const { data: updatedPlan, error: fetchError } = await supabase
      .from("nutrition_plans")
      .select(
        `
        *,
        macro_goals(*)
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
      message: "Nutrition plan updated successfully",
      plan: updatedPlan,
    });
  } catch (error) {
    console.error("Error in PUT /api/professionals/nutrition-plans:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
