import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabaseServer";

/**
 * POST /api/auth/signup
 * Registers a new user and creates their profile records
 */
export async function POST(request: Request) {
  try {
    console.log("Signup request received");
    console.log("Environment check:", {
      hasUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      hasKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    });

    // Create server-side Supabase client
    const supabase = await createServerSupabaseClient();
    console.log("Supabase client created successfully");

    // Parse the request body
    const body = await request.json();
    const { email, password } = body;
    console.log("Signup attempt for email:", email);

    // Validate required fields
    if (!email || !password) {
      return NextResponse.json(
        {
          error: "Missing required fields: email and password are required",
        },
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

    // Validate password length
    if (password.length < 6) {
      return NextResponse.json(
        { error: "Password must be at least 6 characters long" },
        { status: 400 }
      );
    }

    // Sign up the user with Supabase Auth
    console.log("Calling Supabase signUp...");
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
    });

    if (authError) {
      console.error("Supabase signup error:", authError);
      return NextResponse.json({ error: authError.message }, { status: 400 });
    }

    console.log("Signup successful, user ID:", authData.user?.id);

    if (!authData.user) {
      return NextResponse.json(
        { error: "User creation failed" },
        { status: 500 }
      );
    }

    // Check if email confirmation is required
    const emailConfirmationRequired = !authData.session;

    // Return success response
    return NextResponse.json(
      {
        user: {
          id: authData.user.id,
          email: authData.user.email,
        },
        message: emailConfirmationRequired
          ? "Please check your email to confirm your account. After confirmation, complete your profile at /api/auth/complete-profile"
          : "User created successfully. Please complete your profile at /api/auth/complete-profile",
        emailConfirmationRequired,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Signup error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
