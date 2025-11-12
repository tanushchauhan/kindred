import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabaseServer";

/**
 * Server-side middleware to verify admin access
 * Use this in any admin-only API routes to ensure proper authorization
 *
 * @returns {Promise<{ authorized: true, userId: string } | NextResponse>}
 * Returns user data if authorized, or an error response to return immediately
 *
 * @example
 * ```typescript
 * export async function GET() {
 *   const authCheck = await requireAdmin();
 *   if (authCheck instanceof NextResponse) {
 *     return authCheck; // Return error response
 *   }
 *
 *   // User is authorized, continue with admin logic
 *   const { userId } = authCheck;
 *   // ... your admin code here
 * }
 * ```
 */
export async function requireAdmin(): Promise<
  { authorized: true; userId: string } | NextResponse
> {
  try {
    const supabase = await createServerSupabaseClient();

    // Check authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    // Check user role
    const { data: userData, error: userError } = await supabase
      .from("users")
      .select("role")
      .eq("id", user.id)
      .single();

    if (userError || !userData) {
      return NextResponse.json(
        { error: "User profile not found" },
        { status: 404 }
      );
    }

    // Verify admin role
    if (userData.role !== "admin") {
      return NextResponse.json(
        { error: "Forbidden - Admin access required" },
        { status: 403 }
      );
    }

    // User is authorized
    return {
      authorized: true,
      userId: user.id,
    };
  } catch (error) {
    console.error("Error in requireAdmin:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * Check if a user has admin role (without throwing errors)
 * Use this when you need to check admin status without blocking the request
 *
 * @param userId - The user ID to check
 * @returns {Promise<boolean>} True if user is admin, false otherwise
 */
export async function isAdmin(userId: string): Promise<boolean> {
  try {
    const supabase = await createServerSupabaseClient();

    const { data: userData, error } = await supabase
      .from("users")
      .select("role")
      .eq("id", userId)
      .single();

    if (error || !userData) {
      return false;
    }

    return userData.role === "admin";
  } catch (error) {
    console.error("Error in isAdmin:", error);
    return false;
  }
}
