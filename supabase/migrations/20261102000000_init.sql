-- Click your dream: initial schema
-- Matches the dbdiagram design (profiles, questions, quiz_answers, quiz_results,
-- result_explanations) plus answer_scales, question weights, result_profiles and
-- universities so the quiz and result pages are driven by the database.

-- ─── Enums ──────────────────────────────────────────────────────────────────
create type public.user_group as enum ('high_school', 'university', 'working');
create type public.riasec_letter as enum ('R', 'I', 'A', 'S', 'E', 'C');

-- ─── Users ──────────────────────────────────────────────────────────────────
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text,
  user_group public.user_group not null,
  pdpa_consented_at timestamptz,
  created_at timestamptz not null default now()
);

-- ─── Questions ──────────────────────────────────────────────────────────────
-- A 4-point answer scale; label_1 is the lowest, label_4 the highest.
create table public.answer_scales (
  id text primary key,
  name_th text not null,
  label_1 text not null,
  label_2 text not null,
  label_3 text not null,
  label_4 text not null
);

create table public.questions (
  id int primary key,
  riasec_type public.riasec_letter not null,
  text_th text not null,
  sort_order smallint not null unique,
  scale_id text not null references public.answer_scales (id),
  -- How much this statement counts toward its type (1.00 = normal).
  weight numeric(3, 2) not null default 1.00 check (weight > 0),
  is_active boolean not null default true
);

-- ─── Answers and results (latest result only, one row per user) ─────────────
create table public.quiz_answers (
  user_id uuid not null references public.profiles (id) on delete cascade,
  question_id int not null references public.questions (id),
  value smallint not null check (value between 1 and 4),
  answered_at timestamptz not null default now(),
  primary key (user_id, question_id)
);

create table public.quiz_results (
  user_id uuid primary key references public.profiles (id) on delete cascade,
  user_group public.user_group not null,
  score_r smallint not null check (score_r between 0 and 100),
  score_i smallint not null check (score_i between 0 and 100),
  score_a smallint not null check (score_a between 0 and 100),
  score_s smallint not null check (score_s between 0 and 100),
  score_e smallint not null check (score_e between 0 and 100),
  score_c smallint not null check (score_c between 0 and 100),
  holland_code char(3) not null,
  completed_at timestamptz not null default now()
);

create index quiz_results_code_group_idx on public.quiz_results (holland_code, user_group);

-- AI explanations generated ahead of time: 120 codes × 3 groups.
create table public.result_explanations (
  holland_code char(3) not null,
  user_group public.user_group not null,
  body_th text not null,
  model text,
  reviewed boolean not null default false,
  generated_at timestamptz not null default now(),
  primary key (holland_code, user_group)
);

-- ─── Result content (one profile per top RIASEC type) ───────────────────────
create table public.result_profiles (
  riasec_type public.riasec_letter primary key,
  title text not null,
  card_title_1 text not null,
  card_title_2 text not null,
  tagline text not null,
  traits text[] not null,
  card_traits text not null,
  motto text not null,
  strengths jsonb not null, -- [{ "title": "...", "detail": "..." }]
  next_steps text not null,
  activities text[] not null,
  field text not null,
  summary_gradient text not null,
  card_gradient text not null
);

create table public.universities (
  id serial primary key,
  riasec_type public.riasec_letter not null references public.result_profiles (riasec_type),
  sort_order smallint not null,
  code text not null,
  name text not null,
  faculty text not null,
  program text not null,
  url text not null
);

-- ─── Scoring ────────────────────────────────────────────────────────────────
-- answers: { "<question id>": 1..4, ... } for every active question.
-- Score per type = Σ weight·(value−1) / Σ weight·3 × 100, so all-lowest = 0 and
-- all-highest = 100. Ties are broken in R-I-A-S-E-C order.
create or replace function public.score_quiz(answers jsonb)
returns jsonb
language plpgsql
stable
set search_path = public
as $$
declare
  missing int;
  result jsonb;
begin
  select count(*) into missing
  from questions q
  where q.is_active
    and coalesce((answers ->> q.id::text)::int, 0) not between 1 and 4;

  if missing > 0 then
    raise exception 'missing or invalid answers for % question(s)', missing
      using errcode = '22023';
  end if;

  with per_type as (
    select
      q.riasec_type,
      round(100 * sum(q.weight * ((answers ->> q.id::text)::int - 1)) / sum(q.weight * 3))::int as score
    from questions q
    where q.is_active
    group by q.riasec_type
  ),
  ranked as (
    select
      riasec_type,
      score,
      row_number() over (order by score desc, array_position(enum_range(null::riasec_letter), riasec_type)) as rank
    from per_type
  )
  select jsonb_build_object(
    'scores', jsonb_object_agg(riasec_type::text, score),
    'ranking', jsonb_agg(riasec_type order by rank),
    'holland_code', string_agg(riasec_type::text, '' order by rank) filter (where rank <= 3),
    'top_type', (array_agg(riasec_type order by rank))[1]
  )
  into result
  from ranked;

  return result;
end;
$$;

-- ─── Row level security ─────────────────────────────────────────────────────
alter table public.profiles enable row level security;
alter table public.answer_scales enable row level security;
alter table public.questions enable row level security;
alter table public.quiz_answers enable row level security;
alter table public.quiz_results enable row level security;
alter table public.result_explanations enable row level security;
alter table public.result_profiles enable row level security;
alter table public.universities enable row level security;

-- Public content: anyone (including guests) may read.
create policy "read answer scales" on public.answer_scales for select using (true);
create policy "read active questions" on public.questions for select using (is_active);
create policy "read reviewed explanations" on public.result_explanations for select using (reviewed);
create policy "read result profiles" on public.result_profiles for select using (true);
create policy "read universities" on public.universities for select using (true);

-- Personal data: each signed-in user sees and writes only their own rows.
create policy "own profile" on public.profiles for all
  using (auth.uid() = id) with check (auth.uid() = id);
create policy "own answers" on public.quiz_answers for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own result" on public.quiz_results for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

grant execute on function public.score_quiz(jsonb) to anon, authenticated;
