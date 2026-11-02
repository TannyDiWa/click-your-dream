import { USER_GROUPS } from "@/lib/riasec/types";
import { apiError, createUserSupabase, getUserId } from "@/lib/supabase/server";

// Leaving the group step. Gives a visitor without a session a guest id, then
// starts (or resumes) the quiz with `start_quiz`.
// Body: { userGroup, consentVersion? } — consentVersion is the privacy notice
// version the visitor just agreed to; leave it out only if they agreed before.
export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const userGroup = body?.userGroup;
  const consentVersion = body?.consentVersion;
  if (!USER_GROUPS.some((g) => g.value === userGroup)) {
    return Response.json({ error: "userGroup must be one of high_school, university, working" }, { status: 400 });
  }
  if (consentVersion !== undefined && (typeof consentVersion !== "string" || !consentVersion || consentVersion.length > 40)) {
    return Response.json({ error: "consentVersion must be a short string" }, { status: 400 });
  }

  try {
    const supabase = await createUserSupabase();
    // No guest id is created (nothing is stored) before the visitor consents.
    if (!(await getUserId(supabase, { createGuest: consentVersion !== undefined }))) {
      return Response.json({ error: "Consent required" }, { status: 403 });
    }
    const { error } = await supabase.rpc("start_quiz", { p_user_group: userGroup, p_consent_version: consentVersion ?? null });
    if (error) {
      if (error.code === "PDPA1") return Response.json({ error: "Consent required" }, { status: 403 });
      throw error;
    }
    return new Response(null, { status: 204 });
  } catch (error) {
    return apiError(error, "Could not start the quiz");
  }
}
