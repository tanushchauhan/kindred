import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { SignInRequest, AuthResponse } from "@/lib/types";

export async function POST(request: NextRequest) {
  try {
    const body: SignInRequest = await request.json();
    const { email, password } = body;

    // Validate input
    if (!email || !password) {
      return NextResponse.json<AuthResponse>(
        {
          success: false,
          error: "Email and password are required",
        },
        { status: 400 }
      );
    }

    // Sign in with Supabase Auth
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      return NextResponse.json<AuthResponse>(
        {
          success: false,
          error: error.message,
        },
        { status: 401 }
      );
    }

    if (!data.user || !data.session) {
      return NextResponse.json<AuthResponse>(
        {
          success: false,
          error: "Failed to sign in",
        },
        { status: 401 }
      );
    }

    return NextResponse.json<AuthResponse>(
      {
        success: true,
        message: "Signed in successfully",
        user: {
          id: data.user.id,
          email: data.user.email!,
          name: data.user.user_metadata?.name,
        },
        session: {
          access_token: data.session.access_token,
          refresh_token: data.session.refresh_token,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Signin error:", error);
    return NextResponse.json<AuthResponse>(
      {
        success: false,
        error: "An unexpected error occurred",
      },
      { status: 500 }
    );
  }
}
