import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { AuthResponse } from "@/lib/types";

export async function POST(request: NextRequest) {
  try {
    const { refresh_token } = await request.json();

    if (!refresh_token) {
      return NextResponse.json<AuthResponse>(
        {
          success: false,
          error: "Refresh token is required",
        },
        { status: 400 }
      );
    }

    // Refresh the session
    const { data, error } = await supabase.auth.refreshSession({
      refresh_token,
    });

    if (error || !data.session) {
      return NextResponse.json<AuthResponse>(
        {
          success: false,
          error: "Invalid or expired refresh token",
        },
        { status: 401 }
      );
    }

    return NextResponse.json<AuthResponse>(
      {
        success: true,
        message: "Token refreshed successfully",
        session: {
          access_token: data.session.access_token,
          refresh_token: data.session.refresh_token,
        },
        user: data.user
          ? {
              id: data.user.id,
              email: data.user.email!,
              name: data.user.user_metadata?.name,
            }
          : undefined,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Refresh token error:", error);
    return NextResponse.json<AuthResponse>(
      {
        success: false,
        error: "An unexpected error occurred",
      },
      { status: 500 }
    );
  }
}
