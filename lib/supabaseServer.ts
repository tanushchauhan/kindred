import { createServerClient } from "@supabase/ssr";
import { cookies, headers } from "next/headers";

/**
 * Creates a Supabase client for server-side operations in API routes
 * Supports both cookie-based auth (web) and Bearer token auth (mobile)
 * 
 * Authentication priority:
 * 1. Authorization: Bearer <token> header (for mobile/cross-origin)
 * 2. Session cookies (for web/same-origin)
 */
export async function createServerSupabaseClient() {
  const cookieStore = await cookies();
  const headerStore = await headers();

  // Check for Authorization header first (for mobile apps)
  const authHeader = headerStore.get("authorization");
  const bearerToken = authHeader?.startsWith("Bearer ")
    ? authHeader.substring(7)
    : null;

  // Create the base Supabase client with cookie support
  const supabaseClient = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // The `setAll` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
      },
    }
  );

  // If a Bearer token is provided, set it as the session
  // This allows mobile apps to authenticate via Authorization header
  if (bearerToken) {
    // Set the access token in the Supabase client
    // The client will use this token for all subsequent requests
    const { data, error } = await supabaseClient.auth.setSession({
      access_token: bearerToken,
      refresh_token: "", // Not needed for token validation
    });

    if (error) {
      console.error("Error setting bearer token session:", error);
    }
  }

  return supabaseClient;
}
