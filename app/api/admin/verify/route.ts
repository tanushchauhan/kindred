import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/adminAuth";

/**
 * GET /api/admin/verify
 *
 * Server-side admin verification endpoint
 * Returns 200 if user is admin, 403 if not
 * This ensures admin status is verified on the server, not just the client
 */
export async function GET() {
  const authCheck = await requireAdmin();

  if (authCheck instanceof NextResponse) {
    // Return the error response (401, 403, or 500)
    return authCheck;
  }

  // User is verified admin
  return NextResponse.json({
    authorized: true,
    message: "Admin access verified",
  });
}
