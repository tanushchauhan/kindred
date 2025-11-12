import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/adminAuth";

/**
 * POST /api/admin/manage-professional
 * Approve or reject a professional application
 */
export async function POST(request: Request) {
  // Check admin authorization
  const authCheck = await requireAdmin();
  if (authCheck instanceof NextResponse) {
    return authCheck;
  }

  try {
    const body = await request.json();
    const { userId, role, action } = body;

    // Validate input
    if (!userId || !role || !action) {
      return NextResponse.json(
        { error: "Missing required fields: userId, role, action" },
        { status: 400 }
      );
    }

    if (!["trainer", "nutritionist"].includes(role)) {
      return NextResponse.json(
        { error: "Invalid role. Must be trainer or nutritionist" },
        { status: 400 }
      );
    }

    if (!["approve", "reject"].includes(action)) {
      return NextResponse.json(
        { error: "Invalid action. Must be approve or reject" },
        { status: 400 }
      );
    }

    // Use service role to bypass RLS
    const { createClient } = await import("@supabase/supabase-js");
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );

    const tableName =
      role === "trainer" ? "trainer_profiles" : "nutritionist_profiles";

    if (action === "approve") {
      // Approve: Set is_verified to true
      const { error: updateError } = await supabaseAdmin
        .from(tableName)
        .update({ is_verified: true })
        .eq("user_id", userId);

      if (updateError) {
        console.error("Error approving professional:", updateError);
        return NextResponse.json(
          { error: "Failed to approve professional" },
          { status: 500 }
        );
      }

      return NextResponse.json({
        message: "Professional approved successfully",
        userId,
        role,
        action: "approved",
      });
    } else {
      // Reject: Delete the profile and the user
      // First delete the profile
      const { error: profileDeleteError } = await supabaseAdmin
        .from(tableName)
        .delete()
        .eq("user_id", userId);

      if (profileDeleteError) {
        console.error("Error deleting profile:", profileDeleteError);
        return NextResponse.json(
          { error: "Failed to delete profile" },
          { status: 500 }
        );
      }

      // Then delete from users table
      const { error: userDeleteError } = await supabaseAdmin
        .from("users")
        .delete()
        .eq("id", userId);

      if (userDeleteError) {
        console.error("Error deleting user:", userDeleteError);
        return NextResponse.json(
          { error: "Failed to delete user record" },
          { status: 500 }
        );
      }

      // Finally delete from auth.users
      const { error: authDeleteError } =
        await supabaseAdmin.auth.admin.deleteUser(userId);

      if (authDeleteError) {
        console.error("Error deleting auth user:", authDeleteError);
        // Don't return error here as the main data is already deleted
      }

      return NextResponse.json({
        message: "Professional rejected and account deleted",
        userId,
        role,
        action: "rejected",
      });
    }
  } catch (error) {
    console.error("Error in manage-professional:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
