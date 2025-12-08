import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabaseServer";
import { SyncHealthKitDataRequest } from "@/lib/types";

/**
 * POST /api/me/healthkit
 * Sync HealthKit data from mobile app
 * Clients can upload their health and fitness data
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
        { error: "Only clients can sync HealthKit data" },
        { status: 403 }
      );
    }

    // Parse request body
    const body: SyncHealthKitDataRequest = await request.json();

    // Validate required fields
    if (!body.data || !Array.isArray(body.data) || body.data.length === 0) {
      return NextResponse.json(
        { error: "Missing required field: data (array)" },
        { status: 400 }
      );
    }

    // Validate each data entry
    for (const entry of body.data) {
      if (
        !entry.data_type ||
        entry.value === undefined ||
        !entry.unit ||
        !entry.recorded_at
      ) {
        return NextResponse.json(
          {
            error:
              "Each data entry must have: data_type, value, unit, recorded_at",
          },
          { status: 400 }
        );
      }
    }

    // Prepare data for insertion
    const healthKitDataToInsert = body.data.map((entry) => ({
      client_id: user.id,
      data_type: entry.data_type,
      value: entry.value,
      unit: entry.unit,
      recorded_at: entry.recorded_at,
      metadata: entry.metadata || null,
    }));

    // Insert data (handling duplicates by deleting existing records for the same day/type)
    const insertedResults = [];

    for (const entry of healthKitDataToInsert) {
      // 1. Delete existing record for this type and timestamp
      const { error: deleteError } = await supabase
        .from("healthkit_data")
        .delete()
        .match({
          client_id: user.id,
          data_type: entry.data_type,
          recorded_at: entry.recorded_at,
        });

      if (deleteError) {
        console.error(
          `Error deleting existing ${entry.data_type} data:`,
          deleteError
        );
        // Continue anyway to try insert
      }

      // 2. Insert new record
      const { data, error: insertError } = await supabase
        .from("healthkit_data")
        .insert(entry)
        .select();

      if (insertError) {
        console.error(`Error inserting ${entry.data_type} data:`, insertError);
      } else if (data) {
        insertedResults.push(data[0]);
      }
    }

    return NextResponse.json(
      {
        message: "HealthKit data synced successfully",
        synced_count: insertedResults.length,
        data: insertedResults,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error in POST /api/me/healthkit:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * GET /api/me/healthkit
 * Get HealthKit data for the authenticated user
 * Clients can view their own data
 * Professionals can view their matched clients' data
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

    // Get user role
    const { data: userData, error: userError } = await supabase
      .from("users")
      .select("role")
      .eq("id", user.id)
      .single();

    if (userError || !userData) {
      console.error("Error fetching user:", userError);
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const clientId = searchParams.get("client_id");
    const dataType = searchParams.get("data_type");
    const startDate = searchParams.get("start_date");
    const endDate = searchParams.get("end_date");
    const limit = searchParams.get("limit");

    // Determine which client's data to fetch
    let targetClientId = user.id;

    // If professional is requesting client data
    if (
      clientId &&
      (userData.role === "trainer" || userData.role === "nutritionist")
    ) {
      // Verify professional is matched with this client
      const matchField =
        userData.role === "trainer"
          ? "selected_trainer_id"
          : "selected_nutritionist_id";

      const { data: matchData, error: matchError } = await supabase
        .from("client_matches")
        .select("id, client_id")
        .eq("client_id", clientId)
        .eq(matchField, user.id)
        .single();

      if (matchError || !matchData) {
        return NextResponse.json(
          { error: "Client not found or not matched with you" },
          { status: 403 }
        );
      }

      targetClientId = clientId;
    } else if (clientId && userData.role === "client") {
      // Clients can only view their own data
      return NextResponse.json(
        { error: "Clients can only view their own data" },
        { status: 403 }
      );
    }

    // Build query
    let query = supabase
      .from("healthkit_data")
      .select("*")
      .eq("client_id", targetClientId)
      .order("recorded_at", { ascending: false });

    // Apply filters
    if (dataType) {
      query = query.eq("data_type", dataType);
    }

    if (startDate) {
      query = query.gte("recorded_at", startDate);
    }

    if (endDate) {
      query = query.lte("recorded_at", endDate);
    }

    if (limit) {
      const limitNum = parseInt(limit, 10);
      if (!isNaN(limitNum) && limitNum > 0) {
        query = query.limit(limitNum);
      }
    }

    const { data: healthData, error: healthError } = await query;

    if (healthError) {
      console.error("Error fetching HealthKit data:", healthError);
      return NextResponse.json(
        { error: "Failed to fetch HealthKit data" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      data: healthData || [],
      count: healthData?.length || 0,
      client_id: targetClientId,
    });
  } catch (error) {
    console.error("Error in GET /api/me/healthkit:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/me/healthkit
 * Delete HealthKit data entries
 * Only clients can delete their own data
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
        { error: "Only clients can delete HealthKit data" },
        { status: 403 }
      );
    }

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const dataId = searchParams.get("data_id");

    if (!dataId) {
      return NextResponse.json(
        { error: "Missing required parameter: data_id" },
        { status: 400 }
      );
    }

    // Delete data (RLS policy ensures only owner can delete)
    const { error: deleteError } = await supabase
      .from("healthkit_data")
      .delete()
      .eq("id", dataId)
      .eq("client_id", user.id);

    if (deleteError) {
      console.error("Error deleting HealthKit data:", deleteError);
      return NextResponse.json(
        { error: "Failed to delete HealthKit data" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: "HealthKit data deleted successfully",
    });
  } catch (error) {
    console.error("Error in DELETE /api/me/healthkit:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
