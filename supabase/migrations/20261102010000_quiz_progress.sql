-- Click your dream: quiz progress and results in the database for everyone.
-- Guests get a Supabase anonymous user (auth.users.is_anonymous = true), so
-- guests and signed-in users share the same tables and row level security.
-- Requires: Authentication → Sign In / Providers → "Allow anonymous sign-ins".

-- ─── Unfinished quiz (one row per user, removed when the quiz is submitted) ──
create table public.quiz_progress (
  user_id uuid primary key references public.profiles (id) on delete cascade,
  -- 0 = choosing the user group, 1..N = question shown in sort order
  current_step smallint not null default 0 check (current_step >= 0),
  started_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.quiz_progress enable row level security;

create policy "own progress" on public.quiz_progress for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ─── Quiz functions (security invoker: row level security still applies) ────

-- Leaving the group step: sets the group and starts or resumes the quiz.
-- A new attempt (nothing in progress) starts from an empty answer set.
create or replace function public.start_quiz(p_user_group public.user_group)
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

  insert into profiles (id, user_group) values (uid, p_user_group)
  on conflict (id) do update set user_group = excluded.user_group;

  if not exists (select 1 from quiz_progress where user_id = uid) then
    delete from quiz_answers where user_id = uid;
  end if;

  insert into quiz_progress (user_id, current_step) values (uid, 1)
  on conflict (user_id) do update set current_step = 1, updated_at = now();
end;
$$;

-- Saves where the user is, plus the answer they just gave (if any).
create or replace function public.save_quiz_progress(
  p_step smallint,
  p_question_id int default null,
  p_value smallint default null
)
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

  if p_question_id is not null then
    insert into quiz_answers (user_id, question_id, value) values (uid, p_question_id, p_value)
    on conflict (user_id, question_id) do update set value = excluded.value, answered_at = now();
  end if;

  update quiz_progress set current_step = p_step, updated_at = now() where user_id = uid;
end;
$$;

-- Saves the full answer set, scores it with score_quiz and replaces the
-- user's latest result. Raises 22023 (from score_quiz) if answers are missing.
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

  insert into profiles (id, user_group) values (uid, p_user_group)
  on conflict (id) do update set user_group = excluded.user_group;

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

  return score;
end;
$$;

revoke execute on function public.start_quiz(public.user_group) from public, anon;
revoke execute on function public.save_quiz_progress(smallint, int, smallint) from public, anon;
revoke execute on function public.submit_quiz(public.user_group, jsonb) from public, anon;
grant execute on function public.start_quiz(public.user_group) to authenticated;
grant execute on function public.save_quiz_progress(smallint, int, smallint) to authenticated;
grant execute on function public.submit_quiz(public.user_group, jsonb) to authenticated;
