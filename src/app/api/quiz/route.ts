import type { Answers, QuizState } from "@/lib/riasec/api-types";
import { apiError, createUserSupabase, getUserId } from "@/lib/supabase/server";

// The visitor's unfinished quiz and whether they already have a result.
// Visitors without a session (no guest id yet) simply have neither.
export async function GET() {
  try {
    const supabase = await createUserSupabase();
    const userId = await getUserId(supabase);
    if (!userId) return Response.json({ progress: null, hasResult: false } satisfies QuizState);

    const [progress, profile, answers, result] = await Promise.all([
      supabase.from("quiz_progress").select("current_step").eq("user_id", userId).maybeSingle(),
      supabase.from("profiles").select("user_group").eq("id", userId).maybeSingle(),
      supabase.from("quiz_answers").select("question_id, value").eq("user_id", userId),
      supabase.from("quiz_results").select("user_id", { count: "exact", head: true }).eq("user_id", userId),
    ]);
    for (const r of [progress, profile, answers, result]) if (r.error) throw r.error;

    const state: QuizState = {
      progress:
        progress.data && profile.data
          ? {
              userGroup: profile.data.user_group,
              step: progress.data.current_step,
              answers: Object.fromEntries(answers.data!.map((a) => [a.question_id, a.value])) as Answers,
            }
          : null,
      hasResult: (result.count ?? 0) > 0,
    };
    return Response.json(state);
  } catch (error) {
    return apiError(error, "Could not load quiz progress");
  }
}

// Drops the unfinished quiz so the next visit starts from the group step.
// The latest result is kept until a new quiz is submitted.
export async function DELETE() {
  try {
    const supabase = await createUserSupabase();
    const userId = await getUserId(supabase);
    if (!userId) return new Response(null, { status: 204 });

    const [progress, answers] = await Promise.all([
      supabase.from("quiz_progress").delete().eq("user_id", userId),
      supabase.from("quiz_answers").delete().eq("user_id", userId),
    ]);
    for (const r of [progress, answers]) if (r.error) throw r.error;
    return new Response(null, { status: 204 });
  } catch (error) {
    return apiError(error, "Could not reset the quiz");
  }
}
