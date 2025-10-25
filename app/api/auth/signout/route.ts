import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { AuthResponse } from "@/lib/types";

export async function POST() {
  try {
    const { error } = await supabase.auth.signOut();

    if (error) {
      return NextResponse.json<AuthResponse>(
        {
          success: false,
          error: error.message,
        },
        { status: 400 }
      );
    }

    return NextResponse.json<AuthResponse>(
      {
        success: true,
        message: "Signed out successfully",
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Signout error:", error);
    return NextResponse.json<AuthResponse>(
      {
        success: false,
        error: "An unexpected error occurred",
      },
      { status: 500 }
    );
  }
}
