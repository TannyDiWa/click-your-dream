import type { ResultProfile } from "@/lib/riasec/api-types";
import { CHARACTERS, RIASEC_ORDER, type RiasecType } from "@/lib/riasec/types";
import { apiError, createSupabase } from "@/lib/supabase/server";

// Result content for one RIASEC type, e.g. /api/profiles/investigative
export async function GET(_req: Request, ctx: RouteContext<"/api/profiles/[type]">) {
  const { type } = await ctx.params;
  if (!RIASEC_ORDER.includes(type as RiasecType)) {
    return Response.json({ error: "Unknown RIASEC type" }, { status: 404 });
  }
  const letter = CHARACTERS[type as RiasecType].letter;

  try {
    const supabase = createSupabase();
    const [profileRes, uniRes] = await Promise.all([
      supabase.from("result_profiles").select("*").eq("riasec_type", letter).maybeSingle(),
      supabase.from("universities").select("code, name, faculty, program, url").eq("riasec_type", letter).order("sort_order"),
    ]);
    if (profileRes.error) throw profileRes.error;
    if (uniRes.error) throw uniRes.error;
    const p = profileRes.data;
    if (!p) return Response.json({ error: "Profile not found" }, { status: 404 });

    const profile: ResultProfile = {
      title: p.title,
      cardTitle: [p.card_title_1, p.card_title_2],
      tagline: p.tagline,
      traits: p.traits,
      cardTraits: p.card_traits,
      motto: p.motto,
      strengths: p.strengths,
      nextSteps: p.next_steps,
      activities: p.activities,
      field: p.field,
      summaryGradient: p.summary_gradient,
      cardGradient: p.card_gradient,
      universities: uniRes.data,
    };
    return Response.json(profile);
  } catch (error) {
    return apiError(error, "Could not load result profile");
  }
}
