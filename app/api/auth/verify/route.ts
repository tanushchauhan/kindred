import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { AuthResponse } from "@/lib/types";

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json<AuthResponse>(
        {
          success: false,
          error: "No authorization token provided",
        },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);

    // Verify token with Supabase
    const { data, error } = await supabase.auth.getUser(token);

    if (error || !data.user) {
      return NextResponse.json<AuthResponse>(
        {
          success: false,
          error: "Invalid or expired token",
        },
        { status: 401 }
      );
    }

    return NextResponse.json<AuthResponse>(
      {
        success: true,
        user: {
          id: data.user.id,
          email: data.user.email!,
          name: data.user.user_metadata?.name,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Verify token error:", error);
    return NextResponse.json<AuthResponse>(
      {
        success: false,
        error: "An unexpected error occurred",
      },
      { status: 500 }
    );
  }
}
