import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabaseServer";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

/**
 * GET /api/professionals/clients/[clientId]/exercise-completions
 * Get exercise completions for a specific client (professional view)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ clientId: string }> }
) {
  try {
    const { clientId } = await params;
    const supabase = await createServerSupabaseClient();

    // Authenticate user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Verify user is a professional
    const { data: userData, error: userError } = await supabase
      .from("users")
      .select("role")
      .eq("id", user.id)
      .single();

    if (userError || !userData) {
      console.error("Error fetching user:", userError);
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (userData.role !== "trainer" && userData.role !== "nutritionist") {
      return NextResponse.json(
        { error: "Only professionals can access this endpoint" },
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

    // Verify professional is matched with this client
    const { data: matchData, error: matchError } = await adminSupabase
      .from("client_matches")
      .select("*")
      .eq("client_id", clientId)
      .maybeSingle();

    if (matchError) {
      console.error("Error fetching client match:", matchError);
      return NextResponse.json(
        { error: "Failed to verify client match" },
        { status: 500 }
      );
    }

    if (!matchData) {
      return NextResponse.json(
        { error: "Client not found or not matched" },
        { status: 404 }
      );
    }

    // Check if professional is matched with client
    const isMatched =
      (userData.role === "trainer" &&
        matchData.selected_trainer_id === user.id) ||
      (userData.role === "nutritionist" &&
        matchData.selected_nutritionist_id === user.id);

    if (!isMatched) {
      return NextResponse.json(
        { error: "You are not matched with this client" },
        { status: 403 }
      );
    }

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get("start_date");
    const endDate = searchParams.get("end_date");

    // Build query for exercise completions
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
      .eq("client_id", clientId)
      .order("completion_date", { ascending: false });

    // Apply filters
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
    console.error(
      "Error in GET /api/professionals/clients/[clientId]/exercise-completions:",
      error
    );
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
