-- Conclusões das atividades livres. Aplicar após 202609290005_rankings_leagues.sql.
create table if not exists public.activity_completions (
  user_id uuid not null references auth.users(id) on delete cascade,
  local_date date not null,
  activity_slug text not null check (char_length(activity_slug) between 2 and 80),
  cefr_level text not null check (cefr_level in ('A1','A2','B1','B2','C1','C2')),
  completed_at timestamptz not null default now(),
  primary key (user_id, local_date, activity_slug)
);

create index if not exists activity_completions_user_recent_idx
  on public.activity_completions (user_id, completed_at desc);

alter table public.activity_completions enable row level security;

drop policy if exists activity_completions_select_own on public.activity_completions;
create policy activity_completions_select_own on public.activity_completions
  for select to authenticated using ((select auth.uid()) = user_id);

drop policy if exists activity_completions_insert_own on public.activity_completions;
create policy activity_completions_insert_own on public.activity_completions
  for insert to authenticated with check ((select auth.uid()) = user_id);
