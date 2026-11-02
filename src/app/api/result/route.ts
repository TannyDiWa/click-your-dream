import type { QuizResult } from "@/lib/riasec/api-types";
import { toQuizScore } from "@/lib/riasec/scores";
import { apiError, createUserSupabase, getUserId } from "@/lib/supabase/server";

// The visitor's latest result: { result } or { result: null } when there is none.
export async function GET() {
  try {
    const supabase = await createUserSupabase();
    const userId = await getUserId(supabase);
    if (!userId) return Response.json({ result: null });

    const { data, error } = await supabase
      .from("quiz_results")
      .select("user_group, score_r, score_i, score_a, score_s, score_e, score_c, completed_at")
      .eq("user_id", userId)
      .maybeSingle();
    if (error) throw error;
    if (!data) return Response.json({ result: null });

    const result: QuizResult = {
      ...toQuizScore({
        R: data.score_r,
        I: data.score_i,
        A: data.score_a,
        S: data.score_s,
        E: data.score_e,
        C: data.score_c,
      }),
      userGroup: data.user_group,
      completedAt: data.completed_at,
    };
    return Response.json({ result });
  } catch (error) {
    return apiError(error, "Could not load the result");
  }
}
