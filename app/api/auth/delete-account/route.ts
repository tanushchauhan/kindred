import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabaseServer";
import { createClient } from "@supabase/supabase-js";

/**
 * DELETE /api/auth/delete-account
 *
 * Deletes the user's account including:
 * 1. Role-specific profile data (client_profiles, trainer_profiles, or nutritionist_profiles)
 * 2. User record from users table
 * 3. Auth user from Supabase Auth
 *
 * Note: The database has CASCADE deletes configured, so deleting from users table
 * will automatically delete the role-specific profile records.
 */
export async function DELETE() {
  const supabase = await createServerSupabaseClient();

  try {
    // Get the authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const userId = user.id;

    // Step 1: Delete the user record from the users table
    // This will CASCADE delete the role-specific profile due to foreign key constraints
    const { error: deleteUserError } = await supabase
      .from("users")
      .delete()
      .eq("id", userId);

    if (deleteUserError) {
      console.error("Error deleting user record:", deleteUserError);
      return NextResponse.json(
        { error: "Failed to delete user data from database" },
        { status: 500 }
      );
    }

    // Step 2: Delete the user from Supabase Auth using Admin API
    // Create admin client with service role key
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

    const { error: deleteAuthError } =
      await supabaseAdmin.auth.admin.deleteUser(userId);

    if (deleteAuthError) {
      console.error("Error deleting auth user:", deleteAuthError);
      // Even if auth deletion fails, the database records are already deleted
      // Log this but consider it a partial success
      return NextResponse.json(
        {
          error:
            "Database records deleted but failed to remove auth user. Please contact support.",
          partial: true,
        },
        { status: 500 }
      );
    }

    // Step 3: Sign out the user (clear session)
    await supabase.auth.signOut();

    return NextResponse.json({
      message: "Account successfully deleted",
    });
  } catch (error) {
    console.error("Unexpected error during account deletion:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}
