import type { QuizScore } from "@/lib/riasec/api-types";
import { toQuizScore } from "@/lib/riasec/scores";
import { USER_GROUPS } from "@/lib/riasec/types";
import { apiError, createUserSupabase, getUserId } from "@/lib/supabase/server";

// Saves the full answer set, scores it in the database (`submit_quiz`) and
// replaces the visitor's latest result. Needs consent recorded by /api/quiz/start.
// Body: { userGroup, answers: { "<question id>": 1..4 } }
export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const answers = body?.answers;
  const valid =
    USER_GROUPS.some((g) => g.value === body?.userGroup) &&
    answers !== null &&
    typeof answers === "object" &&
    !Array.isArray(answers) &&
    Object.entries(answers).every(([id, v]) => /^\d+$/.test(id) && [1, 2, 3, 4].includes(v as number));
  if (!valid) return Response.json({ error: "Expected { userGroup, answers mapping question ids to 1–4 }" }, { status: 400 });

  try {
    const supabase = await createUserSupabase();
    if (!(await getUserId(supabase))) return Response.json({ error: "Consent required" }, { status: 403 });
    const { data, error } = await supabase.rpc("submit_quiz", { p_user_group: body.userGroup, p_answers: answers });
    if (error) {
      // PDPA1 = the visitor has not agreed to the privacy notice (start_quiz records it)
      if (error.code === "PDPA1") return Response.json({ error: "Consent required" }, { status: 403 });
      // 22023 = raised by score_quiz when some questions are unanswered
      if (error.code === "22023") return Response.json({ error: error.message }, { status: 422 });
      throw error;
    }
    const result: QuizScore = toQuizScore((data as { scores: Record<string, number> }).scores);
    return Response.json(result);
  } catch (error) {
    return apiError(error, "Could not submit answers");
  }
}
