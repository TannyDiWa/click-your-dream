import { createClient } from "@supabase/supabase-js";

export class SupabaseNotConfiguredError extends Error {
  constructor() {
    super("Supabase is not configured: set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local");
  }
}

/**
 * Supabase client for route handlers. Uses the public anon key, so every query
 * goes through row level security; no user session is attached yet.
 */
export function createSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) throw new SupabaseNotConfiguredError();
  return createClient(url, key, { auth: { persistSession: false } });
}

/** JSON error response; hides details except for the setup hint. */
export function apiError(error: unknown, fallback: string) {
  if (error instanceof SupabaseNotConfiguredError) {
    return Response.json({ error: error.message }, { status: 503 });
  }
  console.error(fallback, error);
  return Response.json({ error: fallback }, { status: 500 });
}
