import { USER_GROUPS } from "@/lib/riasec/types";
import { apiError, createUserSupabase, getUserId } from "@/lib/supabase/server";

// Leaving the group step. Gives a visitor without a session a guest id, then
// starts (or resumes) the quiz with `start_quiz`. Body: { userGroup }
export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const userGroup = body?.userGroup;
  if (!USER_GROUPS.some((g) => g.value === userGroup)) {
    return Response.json({ error: "userGroup must be one of high_school, university, working" }, { status: 400 });
  }

  try {
    const supabase = await createUserSupabase();
    await getUserId(supabase, { createGuest: true });
    const { error } = await supabase.rpc("start_quiz", { p_user_group: userGroup });
    if (error) throw error;
    return new Response(null, { status: 204 });
  } catch (error) {
    return apiError(error, "Could not start the quiz");
  }
}
