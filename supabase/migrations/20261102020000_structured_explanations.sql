-- Click your dream: pre-generated explanations become structured JSON.
-- One row per Holland code (3 different letters from RIASEC, 120 codes) and
-- user group = 360 rows, written by scripts/generate-explanations.ts into
-- supabase/explanations.sql. Rows arrive with reviewed = false; only reviewed
-- rows are visible to the app (policy "read reviewed explanations").
--
-- content (keys in English, text in Thai):
-- {
--   "title":          "short name for the combination",
--   "summary":        "2–3 sentences about the combination",
--   "strengths":      [{ "title": "...", "detail": "..." }],   -- 3–4
--   "careers":        [{ "title": "...", "reason": "..." }],   -- 6–8
--   "guidance":       [{ "title": "...", "detail": "..." }],   -- 3–5, by group:
--                     high_school → faculties/fields, university → skills and
--                     internships, working → adjacent paths and courses
--   "try_this_week":  ["...", "...", "..."]                    -- 3
-- }
-- Fields of study are types ("วิศวกรรมคอมพิวเตอร์"), never university names;
-- universities still come from public.universities.

-- Nothing was generated into body_th, so the table is expected to be empty.
alter table public.result_explanations
  drop column body_th,
  add column content jsonb not null check (jsonb_typeof(content) = 'object'),
  add constraint result_explanations_holland_code_check check (
    holland_code ~ '^[RIASEC]{3}$'
    and substr(holland_code, 1, 1) <> substr(holland_code, 2, 1)
    and substr(holland_code, 1, 1) <> substr(holland_code, 3, 1)
    and substr(holland_code, 2, 1) <> substr(holland_code, 3, 1)
  );
