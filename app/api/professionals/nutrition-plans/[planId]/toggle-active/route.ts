import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabaseServer";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

/**
 * PATCH /api/professionals/nutrition-plans/[planId]/toggle-active
 * Toggle the active status of a nutrition plan
 */
export async function PATCH(
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
        { error: "Only nutritionists can modify nutrition plans" },
        { status: 403 }
      );
    }

    // Verify the plan exists and belongs to this nutritionist
    const { data: planData, error: planError } = await adminSupabase
      .from("nutrition_plans")
      .select("id, nutritionist_id, client_id, is_active")
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
        { error: "You can only modify your own nutrition plans" },
        { status: 403 }
      );
    }

    // If setting to active, deactivate all other plans for this client
    if (!planData.is_active) {
      await adminSupabase
        .from("nutrition_plans")
        .update({ is_active: false })
        .eq("client_id", planData.client_id)
        .eq("nutritionist_id", user.id);
    }

    // Toggle the active status
    const { data: updatedPlan, error: updateError } = await adminSupabase
      .from("nutrition_plans")
      .update({
        is_active: !planData.is_active,
        updated_at: new Date().toISOString(),
      })
      .eq("id", planId)
      .select()
      .single();

    if (updateError) {
      console.error("Error toggling plan status:", updateError);
      return NextResponse.json(
        { error: "Failed to update plan status" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: `Plan ${
        updatedPlan.is_active ? "activated" : "deactivated"
      } successfully`,
      plan: updatedPlan,
    });
  } catch (error) {
    console.error(
      "Error in PATCH /api/professionals/nutrition-plans/[planId]/toggle-active:",
      error
    );
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
