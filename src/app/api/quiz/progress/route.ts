import { apiError, createUserSupabase, getUserId } from "@/lib/supabase/server";

const isInt = (v: unknown, min: number, max: number) => Number.isInteger(v) && (v as number) >= min && (v as number) <= max;

// Saves the current step and, optionally, the answer just given.
// Body: { step, answer?: { questionId, value: 1..4 } }
export async function PATCH(request: Request) {
  const body = await request.json().catch(() => null);
  const answer = body?.answer;
  const valid =
    isInt(body?.step, 0, 1000) &&
    (answer === undefined || (isInt(answer?.questionId, 1, 1_000_000) && isInt(answer?.value, 1, 4)));
  if (!valid) return Response.json({ error: "Expected { step, answer?: { questionId, value: 1–4 } }" }, { status: 400 });

  try {
    const supabase = await createUserSupabase();
    if (!(await getUserId(supabase))) return Response.json({ error: "Start the quiz first" }, { status: 401 });

    const { error } = await supabase.rpc("save_quiz_progress", {
      p_step: body.step,
      p_question_id: answer?.questionId ?? null,
      p_value: answer?.value ?? null,
    });
    if (error) {
      // 23503 = unknown question id or no profile yet (quiz not started)
      if (error.code === "23503") return Response.json({ error: error.message }, { status: 409 });
      throw error;
    }
    return new Response(null, { status: 204 });
  } catch (error) {
    return apiError(error, "Could not save progress");
  }
}
