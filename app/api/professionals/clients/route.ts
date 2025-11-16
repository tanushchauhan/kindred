import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabaseServer";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

export async function GET() {
  try {
    const supabase = await createServerSupabaseClient();

    // Get current user
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Validate environment variables
    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      return NextResponse.json(
        { error: "Database configuration missing" },
        { status: 500 }
      );
    }

    // Create admin client to bypass RLS
    const adminSupabase = createClient(
      SUPABASE_URL,
      SUPABASE_SERVICE_ROLE_KEY,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );

    // Get user's role and verification status
    const { data: userData, error: profileError } = await adminSupabase
      .from("users")
      .select("role")
      .eq("id", user.id)
      .single();

    if (profileError || !userData) {
      return NextResponse.json(
        { error: "Failed to fetch user profile" },
        { status: 500 }
      );
    }

    const role = userData.role;

    // Only allow trainers and nutritionists
    if (role !== "trainer" && role !== "nutritionist") {
      return NextResponse.json(
        { error: "Only professionals can access this endpoint" },
        { status: 403 }
      );
    }

    // Check if verified
    let isVerified = false;
    if (role === "nutritionist") {
      const { data: profile } = await adminSupabase
        .from("nutritionist_profiles")
        .select("is_verified")
        .eq("user_id", user.id)
        .single();
      isVerified = profile?.is_verified || false;
    } else {
      const { data: profile } = await adminSupabase
        .from("trainer_profiles")
        .select("is_verified")
        .eq("user_id", user.id)
        .single();
      isVerified = profile?.is_verified || false;
    }

    if (!isVerified) {
      return NextResponse.json(
        { error: "Only verified professionals can access clients" },
        { status: 403 }
      );
    }

    // Fetch matched clients based on role
    const filterField =
      role === "nutritionist"
        ? "selected_nutritionist_id"
        : "selected_trainer_id";

    const { data: matches, error: matchError } = await adminSupabase
      .from("client_matches")
      .select("id, client_id, created_at, last_updated")
      .eq(filterField, user.id);

    console.log(matches);

    if (matchError) {
      console.error("Error fetching client matches:", matchError);
      return NextResponse.json(
        { error: "Failed to fetch clients" },
        { status: 500 }
      );
    }

    if (!matches || matches.length === 0) {
      return NextResponse.json({ clients: [] }, { status: 200 });
    }

    // Fetch client details for all matched clients
    const clientIds = matches.map((match) => match.client_id);

    const { data: clientUsers, error: clientError } = await adminSupabase
      .from("users")
      .select("id, full_name, user_name, location, gender")
      .in("id", clientIds);

    console.log(clientUsers);

    if (clientError) {
      console.error("Error fetching client details:", clientError);
      return NextResponse.json(
        { error: "Failed to fetch client details" },
        { status: 500 }
      );
    }

    // Combine match data with client details
    const clients = matches.map((match) => {
      const clientUser = clientUsers?.find((u) => u.id === match.client_id);
      return {
        match_id: match.id,
        client_id: match.client_id,
        full_name: clientUser?.full_name || null,
        user_name: clientUser?.user_name || null,
        location: clientUser?.location || null,
        gender: clientUser?.gender || null,
        created_at: match.created_at,
        last_updated: match.last_updated,
      };
    });

    return NextResponse.json({ clients }, { status: 200 });
  } catch (error) {
    console.error("Error in GET /api/professionals/clients:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
