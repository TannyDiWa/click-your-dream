import { apiError, createUserSupabase, getUserId } from "@/lib/supabase/server";

// "Delete my data" on /privacy: removes the visitor's guest id with their
// profile, progress, answers and result (`delete_my_data`), then the cookie.
export async function DELETE() {
  try {
    const supabase = await createUserSupabase();
    if (!(await getUserId(supabase))) return new Response(null, { status: 204 });

    const { error } = await supabase.rpc("delete_my_data");
    if (error) throw error;
    // The user is gone, so only clear the session cookie here.
    await supabase.auth.signOut({ scope: "local" });
    return new Response(null, { status: 204 });
  } catch (error) {
    return apiError(error, "Could not delete your data");
  }
}
