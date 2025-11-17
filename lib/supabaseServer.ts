import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
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

  // If Bearer token is provided, create a client with that token
  if (bearerToken) {
    const supabaseClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        global: {
          headers: {
            Authorization: `Bearer ${bearerToken}`,
          },
        },
      }
    );
    
    return supabaseClient;
  }

  // Otherwise, use cookie-based authentication for web clients
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

  return supabaseClient;
}
