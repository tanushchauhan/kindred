import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabaseServer";

/**
 * POST /api/auth/login
 * Authenticates a user and returns their session
 */
export async function POST(request: Request) {
  try {
    // Create server-side Supabase client
    const supabase = await createServerSupabaseClient();

    // Parse the request body
    const body = await request.json();
    const { email, password } = body;

    // Validate required fields
    if (!email || !password) {
      return NextResponse.json(
        { error: "Missing required fields: email and password are required" },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: "Invalid email format" },
        { status: 400 }
      );
    }

    // Attempt to sign in with Supabase Auth
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      console.error("Supabase sign in error:", error);
      return NextResponse.json(
        { error: "Invalid credentials", details: error.message },
        { status: 401 }
      );
    }

    if (!data.session) {
      console.error("No session returned after sign in");
      return NextResponse.json({ error: "Login failed - no session" }, { status: 401 });
    }

    console.log("Login successful for user:", data.user.email);

    // Return success response with session data
    return NextResponse.json(
      {
        session: data.session,
        user: data.user,
        message: "Login successful",
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
