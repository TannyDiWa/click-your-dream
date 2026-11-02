import type { QuizScore } from "@/lib/riasec/api-types";
import { LETTER_TO_TYPE, isRiasecLetter, type RiasecType } from "@/lib/riasec/types";
import { apiError, createSupabase } from "@/lib/supabase/server";

type DbScore = { scores: Record<string, number>; ranking: string[]; holland_code: string; top_type: string };

// Scores a full set of answers with the weighted `score_quiz` database function.
// Body: { answers: { "<question id>": 1..4 } }
export async function POST(request: Request) {
  let answers: unknown;
  try {
    ({ answers } = await request.json());
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }
  const valid =
    answers !== null &&
    typeof answers === "object" &&
    !Array.isArray(answers) &&
    Object.entries(answers).every(([id, v]) => /^\d+$/.test(id) && [1, 2, 3, 4].includes(v as number));
  if (!valid) return Response.json({ error: "answers must map question ids to 1–4" }, { status: 400 });

  try {
    const { data, error } = await createSupabase().rpc("score_quiz", { answers });
    if (error) {
      // 22023 = raised by score_quiz when some questions are unanswered
      if (error.code === "22023") return Response.json({ error: error.message }, { status: 422 });
      throw error;
    }

    const db = data as DbScore;
    const toType = (l: string) => (isRiasecLetter(l) ? LETTER_TO_TYPE[l] : null);
    const scores = Object.fromEntries(
      Object.entries(db.scores).map(([l, v]) => [toType(l), v]),
    ) as Record<RiasecType, number>;

    const result: QuizScore = {
      scores,
      ranking: db.ranking.map((l) => toType(l)!) ,
      hollandCode: db.holland_code,
      topType: toType(db.top_type)!,
    };
    return Response.json(result);
  } catch (error) {
    return apiError(error, "Could not score answers");
  }
}
