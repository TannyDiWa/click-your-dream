-- Click your dream: PDPA consent, "delete my data" and the retention job.
-- Matches the privacy notice at /privacy (src/lib/privacy.ts):
--   * nothing is stored until the visitor consents (start_quiz takes the
--     notice version they agreed to; submit_quiz needs a consented profile)
--   * answers are removed once the quiz is submitted; only the latest result stays
--   * delete_my_data removes the guest and everything that belongs to them
--   * guests with no quiz activity for a year are removed every night
-- Requires: Database → Extensions → pg_cron (created below if allowed).

-- ─── Consent ────────────────────────────────────────────────────────────────
-- pdpa_consented_at already exists; this records which notice was agreed to.
alter table public.profiles add column pdpa_notice_version text;

drop function public.start_quiz(public.user_group);

-- Leaving the group step: sets the group and starts or resumes the quiz.
-- p_consent_version records consent to that notice version; without it the
-- visitor must have consented before. Raises PDPA1 (and stores nothing) otherwise.
create or replace function public.start_quiz(p_user_group public.user_group, p_consent_version text default null)
returns void
language plpgsql
set search_path = public
as $$
declare
  uid uuid := auth.uid();
begin
  if uid is null then
    raise exception 'not signed in' using errcode = '42501';
  end if;

  insert into profiles (id, user_group, pdpa_consented_at, pdpa_notice_version)
  values (uid, p_user_group, case when p_consent_version is not null then now() end, p_consent_version)
  on conflict (id) do update set
    user_group = excluded.user_group,
    pdpa_consented_at = coalesce(excluded.pdpa_consented_at, profiles.pdpa_consented_at),
    pdpa_notice_version = coalesce(excluded.pdpa_notice_version, profiles.pdpa_notice_version);

  if not exists (select 1 from profiles where id = uid and pdpa_consented_at is not null) then
    raise exception 'consent required' using errcode = 'PDPA1';
  end if;

  if not exists (select 1 from quiz_progress where user_id = uid) then
    delete from quiz_answers where user_id = uid;
  end if;

  insert into quiz_progress (user_id, current_step) values (uid, 1)
  on conflict (user_id) do update set current_step = 1, updated_at = now();
end;
$$;

-- Saves the full answer set, scores it with score_quiz and replaces the
-- user's latest result, then drops the answers. Raises PDPA1 without consent
-- and 22023 (from score_quiz) if answers are missing.
create or replace function public.submit_quiz(p_user_group public.user_group, p_answers jsonb)
returns jsonb
language plpgsql
set search_path = public
as $$
declare
  uid uuid := auth.uid();
  all_answers jsonb;
  score jsonb;
begin
  if uid is null then
    raise exception 'not signed in' using errcode = '42501';
  end if;

  update profiles set user_group = p_user_group where id = uid and pdpa_consented_at is not null;
  if not found then
    raise exception 'consent required' using errcode = 'PDPA1';
  end if;

  insert into quiz_answers (user_id, question_id, value)
  select uid, a.key::int, a.value::smallint
  from jsonb_each_text(p_answers) a
  join questions q on q.id = a.key::int and q.is_active
  on conflict (user_id, question_id) do update set value = excluded.value, answered_at = now();

  select coalesce(jsonb_object_agg(question_id::text, value), '{}'::jsonb)
  into all_answers
  from quiz_answers
  where user_id = uid;

  score := score_quiz(all_answers);

  insert into quiz_results (
    user_id, user_group, score_r, score_i, score_a, score_s, score_e, score_c, holland_code, completed_at
  ) values (
    uid,
    p_user_group,
    (score -> 'scores' ->> 'R')::smallint,
    (score -> 'scores' ->> 'I')::smallint,
    (score -> 'scores' ->> 'A')::smallint,
    (score -> 'scores' ->> 'S')::smallint,
    (score -> 'scores' ->> 'E')::smallint,
    (score -> 'scores' ->> 'C')::smallint,
    score ->> 'holland_code',
    now()
  )
  on conflict (user_id) do update set
    user_group = excluded.user_group,
    score_r = excluded.score_r,
    score_i = excluded.score_i,
    score_a = excluded.score_a,
    score_s = excluded.score_s,
    score_e = excluded.score_e,
    score_c = excluded.score_c,
    holland_code = excluded.holland_code,
    completed_at = excluded.completed_at;

  delete from quiz_progress where user_id = uid;
  delete from quiz_answers where user_id = uid;

  return score;
end;
$$;

revoke execute on function public.start_quiz(public.user_group, text) from public, anon;
grant execute on function public.start_quiz(public.user_group, text) to authenticated;

-- ─── Delete my data ─────────────────────────────────────────────────────────
-- Removes the visitor's auth user; profiles, progress, answers and the result
-- go with it (on delete cascade).
create or replace function public.delete_my_data()
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if auth.uid() is null then
    raise exception 'not signed in' using errcode = '42501';
  end if;
  delete from auth.users where id = auth.uid();
end;
$$;

revoke execute on function public.delete_my_data() from public, anon;
grant execute on function public.delete_my_data() to authenticated;

-- ─── Retention ──────────────────────────────────────────────────────────────
-- Guests whose last quiz activity is over a year old. Keep the interval in
-- step with PRIVACY.retention in src/lib/privacy.ts.
create or replace function public.purge_inactive_guests()
returns int
language sql
security definer
set search_path = ''
as $$
  with gone as (
    delete from auth.users u
    where u.is_anonymous
      and greatest(
        u.created_at,
        (select p.created_at from public.profiles p where p.id = u.id),
        (select p.pdpa_consented_at from public.profiles p where p.id = u.id),
        (select qp.updated_at from public.quiz_progress qp where qp.user_id = u.id),
        (select qr.completed_at from public.quiz_results qr where qr.user_id = u.id)
      ) < now() - interval '1 year'
    returning 1
  )
  select count(*)::int from gone;
$$;

revoke execute on function public.purge_inactive_guests() from public, anon, authenticated;

create extension if not exists pg_cron;
select cron.schedule('purge-inactive-guests', '15 3 * * *', 'select public.purge_inactive_guests()');
