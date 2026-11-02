import { createServerClient } from "@supabase/ssr";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { unstable_rethrow } from "next/navigation";

export class SupabaseNotConfiguredError extends Error {
  constructor(message = "Supabase is not configured: set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local") {
    super(message);
  }
}

function env() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) throw new SupabaseNotConfiguredError();
  return { url, key };
}

/**
 * Supabase client for public content (questions, result profiles). Uses the
 * public anon key, so every query goes through row level security.
 */
export function createSupabase() {
  const { url, key } = env();
  return createClient(url, key, { auth: { persistSession: false } });
}

/**
 * Supabase client acting as the visitor, with the session kept in cookies.
 * Route handlers only: refreshing or creating a session sets cookies.
 */
export async function createUserSupabase() {
  const { url, key } = env();
  const cookieStore = await cookies();
  return createServerClient(url, key, {
    cookies: {
      getAll: () => cookieStore.getAll(),
      setAll: (list) => {
        for (const { name, value, options } of list) cookieStore.set(name, value, options);
      },
    },
  });
}

/**
 * The visitor's user id. With `createGuest`, a visitor without a session is
 * signed in as a Supabase anonymous user (a guest id kept in a cookie).
 */
export async function getUserId(supabase: SupabaseClient, { createGuest = false } = {}) {
  const { data } = await supabase.auth.getClaims();
  if (data?.claims.sub) return data.claims.sub;
  if (!createGuest) return null;

  const { data: guest, error } = await supabase.auth.signInAnonymously();
  if (error) {
    if (error.code === "anonymous_provider_disabled") {
      throw new SupabaseNotConfiguredError(
        "Guest sessions are off: enable Authentication → Sign In / Providers → Allow anonymous sign-ins in Supabase",
      );
    }
    throw error;
  }
  return guest.user!.id;
}

/** JSON error response; hides details except for the setup hint. */
export function apiError(error: unknown, fallback: string) {
  // Let Next.js handle its own signals, e.g. cookies() during prerendering.
  unstable_rethrow(error);
  if (error instanceof SupabaseNotConfiguredError) {
    return Response.json({ error: error.message }, { status: 503 });
  }
  console.error(fallback, error);
  return Response.json({ error: fallback }, { status: 500 });
}
