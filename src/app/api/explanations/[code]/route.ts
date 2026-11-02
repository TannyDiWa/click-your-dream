import type { ResultExplanation } from "@/lib/riasec/api-types";
import type { UserGroup } from "@/lib/riasec/types";
import { apiError, createSupabase } from "@/lib/supabase/server";

const GROUPS: UserGroup[] = ["high_school", "university", "working"];

// Explanation for a Holland code and user group, e.g. /api/explanations/ESA?group=university.
// { explanation } or { explanation: null } when no reviewed row exists yet.
export async function GET(req: Request, ctx: RouteContext<"/api/explanations/[code]">) {
  const { code } = await ctx.params;
  const group = new URL(req.url).searchParams.get("group") as UserGroup | null;
  if (!/^[RIASEC]{3}$/.test(code) || new Set(code).size !== 3) {
    return Response.json({ error: "Unknown Holland code" }, { status: 404 });
  }
  if (!group || !GROUPS.includes(group)) {
    return Response.json({ error: "Unknown user group" }, { status: 400 });
  }

  try {
    // Row level security only returns reviewed rows.
    const { data, error } = await createSupabase()
      .from("result_explanations")
      .select("content")
      .eq("holland_code", code)
      .eq("user_group", group)
      .maybeSingle();
    if (error) throw error;
    if (!data) return Response.json({ explanation: null });

    const c = data.content;
    const explanation: ResultExplanation = {
      title: c.title,
      summary: c.summary,
      strengths: c.strengths,
      careers: c.careers,
      guidance: c.guidance,
      tryThisWeek: c.try_this_week,
    };
    return Response.json({ explanation });
  } catch (error) {
    return apiError(error, "Could not load the explanation");
  }
}
