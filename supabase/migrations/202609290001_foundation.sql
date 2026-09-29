-- English Journey, fase 1. Executar pelo Supabase CLI em um projeto novo.
create extension if not exists pgcrypto;

create table public.profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null default 'Estudante' check (char_length(display_name) between 1 and 80),
  avatar_url text,
  cefr_level text not null default 'A1' check (cefr_level in ('A1','A2','B1','B2','C1','C2')),
  learning_reason text,
  onboarding_completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.user_settings (
  user_id uuid primary key references auth.users(id) on delete cascade,
  timezone text not null default 'America/Sao_Paulo',
  theme text not null default 'system' check (theme in ('light','dark','system')),
  ranking_public boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.daily_goals (
  user_id uuid primary key references auth.users(id) on delete cascade,
  target_minutes smallint not null default 20 check (target_minutes between 5 and 240),
  updated_at timestamptz not null default now()
);

create table public.study_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  started_at timestamptz not null default now(),
  ended_at timestamptz,
  duration_seconds integer check (duration_seconds between 0 and 14400),
  source text not null check (source in ('lesson','vocabulary','review','reading','listening','writing','speaking')),
  check (ended_at is null or ended_at >= started_at)
);

create index study_sessions_user_started_idx on public.study_sessions (user_id, started_at desc);

create or replace function public.create_user_defaults()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profiles (user_id, display_name)
  values (new.id, coalesce(nullif(left(new.raw_user_meta_data ->> 'display_name', 80), ''), 'Estudante'));
  insert into public.user_settings (user_id) values (new.id);
  insert into public.daily_goals (user_id) values (new.id);
  return new;
end;
$$;

create trigger on_auth_user_created
after insert on auth.users for each row execute procedure public.create_user_defaults();

alter table public.profiles enable row level security;
alter table public.user_settings enable row level security;
alter table public.daily_goals enable row level security;
alter table public.study_sessions enable row level security;

create policy profiles_select_own on public.profiles for select to authenticated using ((select auth.uid()) = user_id);
create policy profiles_update_own on public.profiles for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy settings_select_own on public.user_settings for select to authenticated using ((select auth.uid()) = user_id);
create policy settings_update_own on public.user_settings for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy goals_select_own on public.daily_goals for select to authenticated using ((select auth.uid()) = user_id);
create policy goals_update_own on public.daily_goals for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy sessions_select_own on public.study_sessions for select to authenticated using ((select auth.uid()) = user_id);

create or replace function public.complete_onboarding(
  p_level text,
  p_reason text,
  p_target_minutes integer,
  p_timezone text
)
returns void language plpgsql security definer set search_path = '' as $$
declare v_user_id uuid := (select auth.uid());
begin
  if v_user_id is null then raise exception 'Not authenticated' using errcode = '28000'; end if;
  if p_level not in ('A1','A2','B1','B2','C1') or p_reason not in ('Viagens','Trabalho','Programação','Negócios','Estudos','Conversação','Outro') or p_target_minutes not between 5 and 240 or not exists (select 1 from pg_catalog.pg_timezone_names where name = p_timezone) then
    raise exception 'Invalid onboarding input' using errcode = '22023';
  end if;
  if exists (select 1 from public.profiles where user_id = v_user_id and onboarding_completed_at is not null) then
    raise exception 'Onboarding already completed' using errcode = '22023';
  end if;
  update public.daily_goals set target_minutes = p_target_minutes, updated_at = now() where user_id = v_user_id;
  update public.user_settings set timezone = p_timezone, updated_at = now() where user_id = v_user_id;
  update public.profiles set cefr_level = p_level, learning_reason = p_reason, onboarding_completed_at = now(), updated_at = now() where user_id = v_user_id;
end;
$$;
revoke all on function public.complete_onboarding(text,text,integer,text) from public;
grant execute on function public.complete_onboarding(text,text,integer,text) to authenticated;

-- A conclusão do onboarding altera exclusivamente campos permitidos; RLS acima bloqueia outras linhas.
-- Outras entidades serão adicionadas em migrations das respectivas fases, com regras de escrita de servidor.
