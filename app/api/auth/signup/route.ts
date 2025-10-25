import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { SignUpRequest, AuthResponse } from "@/lib/types";

export async function POST(request: NextRequest) {
  try {
    const body: SignUpRequest = await request.json();
    const { email, password, name } = body;

    // Validate input
    if (!email || !password || !name) {
      return NextResponse.json<AuthResponse>(
        {
          success: false,
          error: "Email, password, and name are required",
        },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json<AuthResponse>(
        {
          success: false,
          error: "Password must be at least 6 characters",
        },
        { status: 400 }
      );
    }

    // Sign up with Supabase Auth
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name: name,
        },
      },
    });

    if (error) {
      return NextResponse.json<AuthResponse>(
        {
          success: false,
          error: error.message,
        },
        { status: 400 }
      );
    }

    if (!data.user) {
      return NextResponse.json<AuthResponse>(
        {
          success: false,
          error: "Failed to create user",
        },
        { status: 500 }
      );
    }

    return NextResponse.json<AuthResponse>(
      {
        success: true,
        message:
          "Account created successfully! Please check your email to verify your account.",
        user: {
          id: data.user.id,
          email: data.user.email!,
          name: data.user.user_metadata?.name,
        },
        session: data.session
          ? {
              access_token: data.session.access_token,
              refresh_token: data.session.refresh_token,
            }
          : undefined,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Signup error:", error);
    return NextResponse.json<AuthResponse>(
      {
        success: false,
        error: "An unexpected error occurred",
      },
      { status: 500 }
    );
  }
}
