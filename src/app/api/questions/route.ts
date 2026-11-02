import type { QuizQuestion } from "@/lib/riasec/api-types";
import { apiError, createSupabase } from "@/lib/supabase/server";

// Active questions in display order with their answer labels.
// RIASEC type and weight stay on the server so they don't steer answers.
export async function GET() {
  try {
    const { data, error } = await createSupabase()
      .from("questions")
      .select("id, text_th, sort_order, answer_scales(label_1, label_2, label_3, label_4)")
      .eq("is_active", true)
      .order("sort_order");
    if (error) throw error;

    const questions: QuizQuestion[] = data.map((q) => {
      // A many-to-one embed comes back as an object; typed loosely by the client.
      const s = q.answer_scales as unknown as { label_1: string; label_2: string; label_3: string; label_4: string };
      return { id: q.id, text: q.text_th, sortOrder: q.sort_order, labels: [s.label_1, s.label_2, s.label_3, s.label_4] };
    });
    return Response.json({ questions });
  } catch (error) {
    return apiError(error, "Could not load questions");
  }
}
