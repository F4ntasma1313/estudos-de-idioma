-- Executar uma vez após 202609290001_foundation.sql no SQL Editor do Supabase.

-- Fases 2 a 5: catálogo, revisão, currículo e gamificação verificadas pelo banco.
create extension if not exists pg_trgm;

create table public.vocabulary_categories (
  id uuid primary key default gen_random_uuid(), slug text not null unique, name text not null,
  created_at timestamptz not null default now()
);
create table public.vocabulary_words (
  id uuid primary key default gen_random_uuid(), word text not null,
  word_key text generated always as (lower(btrim(word))) stored unique,
  translation text not null,
  phonetic text, definition_en text not null, definition_pt text,
  example_en text not null, example_pt text,
  cefr_level text not null check (cefr_level in ('A1','A2','B1','B2','C1','C2')),
  word_type text not null check (word_type in ('noun','verb','adjective','adverb','pronoun','preposition','conjunction','expression','phrasal_verb')),
  category_id uuid references public.vocabulary_categories(id),
  frequency_rank integer check (frequency_rank > 0),
  audio_url text, image_url text,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create index vocabulary_words_level_frequency_idx on public.vocabulary_words (cefr_level, frequency_rank, id);
do $$
declare v_schema text;
begin
  select n.nspname into v_schema from pg_extension e
  join pg_namespace n on n.oid = e.extnamespace where e.extname = 'pg_trgm';
  execute format('create index vocabulary_words_search_en_idx on public.vocabulary_words using gin (word %I.gin_trgm_ops)', v_schema);
  execute format('create index vocabulary_words_search_pt_idx on public.vocabulary_words using gin (translation %I.gin_trgm_ops)', v_schema);
end $$;

create table public.user_vocabulary (
  user_id uuid not null references auth.users(id) on delete cascade,
  word_id uuid not null references public.vocabulary_words(id) on delete cascade,
  status text not null default 'new' check (status in ('new','learning','reviewing','mastered')),
  correct_answers integer not null default 0 check (correct_answers >= 0),
  wrong_answers integer not null default 0 check (wrong_answers >= 0),
  mastery_score smallint not null default 0 check (mastery_score between 0 and 100),
  review_count integer not null default 0 check (review_count >= 0),
  review_interval_days numeric(8,2) not null default 0 check (review_interval_days >= 0),
  ease_factor numeric(3,2) not null default 2.50 check (ease_factor between 1.30 and 3.00),
  last_review_at timestamptz, next_review_at timestamptz,
  first_seen_at timestamptz not null default now(), learned_at timestamptz,
  is_favorite boolean not null default false,
  primary key (user_id, word_id)
);
create index user_vocabulary_due_idx on public.user_vocabulary (user_id, next_review_at, word_id);

create table public.exercise_attempts (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade,
  word_id uuid not null references public.vocabulary_words(id), operation_id uuid not null,
  answer text not null, is_correct boolean not null, awarded_xp smallint not null default 0,
  response_time_ms integer check (response_time_ms between 0 and 300000),
  answered_at timestamptz not null default now(),
  unique (user_id, operation_id)
);
create index exercise_attempts_user_date_idx on public.exercise_attempts (user_id, answered_at desc);
create index exercise_attempts_user_word_date_idx on public.exercise_attempts (user_id, word_id, answered_at desc);

create table public.xp_transactions (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade,
  amount integer not null check (amount > 0), source_type text not null,
  source_id uuid not null, description text not null, created_at timestamptz not null default now(),
  unique (user_id, source_type, source_id)
);
create index xp_transactions_user_date_idx on public.xp_transactions (user_id, created_at desc);
create table public.user_levels (
  user_id uuid primary key references auth.users(id) on delete cascade,
  total_xp integer not null default 0 check (total_xp >= 0), level smallint not null default 1 check (level between 1 and 100),
  updated_at timestamptz not null default now()
);
create table public.streaks (
  user_id uuid primary key references auth.users(id) on delete cascade,
  current_days integer not null default 0 check (current_days >= 0),
  longest_days integer not null default 0 check (longest_days >= 0),
  last_goal_date date, freezes_available smallint not null default 0 check (freezes_available between 0 and 10)
);
create table public.user_daily_progress (
  user_id uuid not null references auth.users(id) on delete cascade, local_date date not null,
  activity_seconds integer not null default 0 check (activity_seconds >= 0),
  answers integer not null default 0 check (answers >= 0),
  correct_answers integer not null default 0 check (correct_answers >= 0),
  xp_earned integer not null default 0 check (xp_earned >= 0),
  goal_reached_at timestamptz,
  primary key (user_id, local_date)
);

create table public.tracks (
  id uuid primary key default gen_random_uuid(), slug text not null unique, title text not null,
  description text not null, cefr_level text check (cefr_level in ('A1','A2','B1','B2','C1','C2')),
  published boolean not null default false
);
create table public.modules (
  id uuid primary key default gen_random_uuid(), track_id uuid not null references public.tracks(id) on delete cascade,
  title text not null, position integer not null check (position > 0), unique (track_id, position)
);
create table public.lessons (
  id uuid primary key default gen_random_uuid(), module_id uuid not null references public.modules(id) on delete cascade,
  title text not null, description text not null, position integer not null check (position > 0),
  published boolean not null default false, unique (module_id, position)
);
create table public.lesson_exercises (
  id uuid primary key default gen_random_uuid(), lesson_id uuid not null references public.lessons(id) on delete cascade,
  word_id uuid not null references public.vocabulary_words(id), position integer not null check (position > 0),
  unique (lesson_id, position), unique (lesson_id, word_id)
);
alter table public.exercise_attempts add column lesson_id uuid references public.lessons(id);
create table public.user_lesson_progress (
  user_id uuid not null references auth.users(id) on delete cascade,
  lesson_id uuid not null references public.lessons(id) on delete cascade,
  correct_answers integer not null default 0, total_exercises integer not null default 0,
  completed_at timestamptz, primary key (user_id, lesson_id)
);
create index modules_track_position_idx on public.modules (track_id, position);
create index lessons_module_position_idx on public.lessons (module_id, position);

create table public.achievements (
  id uuid primary key default gen_random_uuid(), slug text not null unique, title text not null,
  description text not null, rarity text not null check (rarity in ('common','rare','epic','legendary')),
  metric text not null, threshold integer not null check (threshold > 0)
);
create table public.user_achievements (
  user_id uuid not null references auth.users(id) on delete cascade,
  achievement_id uuid not null references public.achievements(id), earned_at timestamptz not null default now(),
  primary key (user_id, achievement_id)
);
create table public.coin_transactions (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade,
  amount integer not null check (amount <> 0), source_type text not null, source_id uuid not null,
  description text not null, created_at timestamptz not null default now(),
  unique (user_id, source_type, source_id)
);
create table public.missions (
  id uuid primary key default gen_random_uuid(), slug text not null unique, title text not null,
  period text not null check (period in ('daily','weekly')),
  metric text not null, target integer not null check (target > 0),
  reward_xp integer not null default 0, reward_coins integer not null default 0
);
create table public.user_missions (
  instance_id uuid not null default gen_random_uuid() unique,
  user_id uuid not null references auth.users(id) on delete cascade,
  mission_id uuid not null references public.missions(id), period_start date not null,
  progress integer not null default 0, completed_at timestamptz, claimed_at timestamptz,
  primary key (user_id, mission_id, period_start)
);
create table public.notifications (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade,
  type text not null, title text not null, message text not null,
  data jsonb not null default '{}'::jsonb, read_at timestamptz, created_at timestamptz not null default now()
);
create index notifications_user_date_idx on public.notifications (user_id, created_at desc);

alter table public.user_settings
  add column push_enabled boolean not null default false,
  add column daily_reminder_enabled boolean not null default false,
  add column reminder_time time not null default '18:30';

create table public.push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  endpoint text not null unique, p256dh text not null, auth text not null,
  device_name text, user_agent text,
  created_at timestamptz not null default now(), last_used_at timestamptz
);
create index push_subscriptions_user_idx on public.push_subscriptions (user_id);
alter table public.push_subscriptions enable row level security;
create policy push_read_own on public.push_subscriptions for select to authenticated using ((select auth.uid()) = user_id);
create policy push_insert_own on public.push_subscriptions for insert to authenticated with check ((select auth.uid()) = user_id);
create policy push_update_own on public.push_subscriptions for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy push_delete_own on public.push_subscriptions for delete to authenticated using ((select auth.uid()) = user_id);

create table public.push_deliveries (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade,
  kind text not null, local_date date not null,
  status text not null default 'pending' check (status in ('pending','sent','failed')),
  attempts smallint not null default 0, last_error text,
  created_at timestamptz not null default now(), sent_at timestamptz,
  unique (user_id,kind,local_date)
);
alter table public.push_deliveries enable row level security;
create policy push_deliveries_read_own on public.push_deliveries for select to authenticated using ((select auth.uid()) = user_id);

create or replace function public.mark_notification_read(p_notification_id uuid)
returns void language sql security definer set search_path = '' as $$
  update public.notifications set read_at = now()
  where id = p_notification_id and user_id = (select auth.uid()) and read_at is null;
$$;
revoke all on function public.mark_notification_read(uuid) from public;
grant execute on function public.mark_notification_read(uuid) to authenticated;

create or replace function public.create_user_defaults()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profiles (user_id, display_name)
  values (new.id, coalesce(nullif(left(new.raw_user_meta_data ->> 'display_name', 80), ''), 'Estudante'));
  insert into public.user_settings (user_id) values (new.id);
  insert into public.daily_goals (user_id) values (new.id);
  insert into public.user_levels (user_id) values (new.id);
  insert into public.streaks (user_id) values (new.id);
  return new;
end;
$$;
insert into public.user_levels (user_id) select id from auth.users on conflict do nothing;
insert into public.streaks (user_id) select id from auth.users on conflict do nothing;

-- Catálogos não aceitam escrita de usuários comuns.
do $$ declare t text; begin
  foreach t in array array['vocabulary_categories','vocabulary_words','tracks','modules','lessons','lesson_exercises','achievements','missions'] loop
    execute format('alter table public.%I enable row level security', t);
    execute format('create policy %I on public.%I for select to authenticated using (true)', t || '_read', t);
  end loop;
end $$;
-- Dados privados são legíveis pelo dono; toda escrita relevante passa por função de domínio.
do $$ declare t text; begin
  foreach t in array array['user_vocabulary','exercise_attempts','xp_transactions','user_levels','streaks','user_daily_progress','user_lesson_progress','user_achievements','coin_transactions','user_missions','notifications'] loop
    execute format('alter table public.%I enable row level security', t);
    execute format('create policy %I on public.%I for select to authenticated using ((select auth.uid()) = user_id)', t || '_read_own', t);
  end loop;
end $$;

-- A resposta é julgada e pontuada dentro de uma transação; operação repetida é idempotente.
create or replace function public.submit_vocabulary_answer(
  p_word_id uuid, p_answer text, p_operation_id uuid, p_response_time_ms integer default null,
  p_lesson_id uuid default null
)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  v_user uuid := (select auth.uid()); v_word public.vocabulary_words%rowtype;
  v_existing public.exercise_attempts%rowtype; v_progress public.user_vocabulary%rowtype;
  v_correct boolean; v_xp integer := 0; v_total_xp integer; v_level integer;
  v_repeat_count integer; v_day_xp integer; v_local_date date; v_seconds integer;
  v_target_seconds integer; v_daily public.user_daily_progress%rowtype;
  v_interval numeric; v_ease numeric; v_mastery integer; v_status text;
  v_mission public.missions%rowtype; v_user_mission public.user_missions%rowtype;
  v_mission_xp integer := 0; v_coins integer := 0; v_attempts_last_minute integer;
  v_week_start date; v_study_days integer;
begin
  if v_user is null then raise exception 'Not authenticated' using errcode = '28000'; end if;
  if p_operation_id is null or p_answer is null or char_length(p_answer) > 200 or p_response_time_ms not between 0 and 300000 then
    raise exception 'Invalid answer' using errcode = '22023';
  end if;
  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(v_user::text, 0));
  select * into v_existing from public.exercise_attempts where user_id = v_user and operation_id = p_operation_id;
  if found then
    select total_xp, level into v_total_xp, v_level from public.user_levels where user_id = v_user;
    select * into v_word from public.vocabulary_words where id = v_existing.word_id;
    select * into v_progress from public.user_vocabulary where user_id = v_user and word_id = v_existing.word_id;
    return jsonb_build_object('correct',v_existing.is_correct,'translation',v_word.translation,
      'awardedXp',v_existing.awarded_xp,'totalXp',v_total_xp,'level',v_level,
      'mastery',v_progress.mastery_score,'nextReviewAt',v_progress.next_review_at,'duplicate',true);
  end if;
  select count(*) into v_attempts_last_minute from public.exercise_attempts
  where user_id = v_user and answered_at > now() - interval '1 minute';
  if v_attempts_last_minute >= 30 then raise exception 'Too many answers' using errcode = 'P0001'; end if;
  select * into v_word from public.vocabulary_words where id = p_word_id;
  if not found then raise exception 'Word not found' using errcode = '22023'; end if;
  if p_lesson_id is not null and not exists (select 1 from public.lesson_exercises where lesson_id = p_lesson_id and word_id = p_word_id) then
    raise exception 'Word is not part of lesson' using errcode = '22023';
  end if;
  v_correct := lower(btrim(p_answer)) = lower(btrim(v_word.translation));
  select * into v_progress from public.user_vocabulary where user_id = v_user and word_id = p_word_id;
  v_ease := coalesce(v_progress.ease_factor, 2.50);
  v_mastery := coalesce(v_progress.mastery_score, 0);
  if v_correct then
    v_ease := least(3.00, v_ease + 0.10);
    v_interval := case when coalesce(v_progress.review_interval_days,0) < 1 then 1
                       when v_progress.review_interval_days < 3 then 3
                       else least(365, round(v_progress.review_interval_days * v_ease, 2)) end;
    v_mastery := least(100, v_mastery + case when v_word.cefr_level in ('C1','C2') then 10 else 12 end);
  else
    v_ease := greatest(1.30, v_ease - 0.20); v_interval := 0.01;
    v_mastery := greatest(0, v_mastery - 8);
  end if;
  v_status := case when v_mastery = 100 then 'mastered' when v_mastery >= 60 then 'reviewing' else 'learning' end;
  insert into public.user_vocabulary (user_id,word_id,status,correct_answers,wrong_answers,mastery_score,review_count,review_interval_days,ease_factor,last_review_at,next_review_at,learned_at)
  values (v_user,p_word_id,v_status,case when v_correct then 1 else 0 end,case when v_correct then 0 else 1 end,v_mastery,1,v_interval,v_ease,now(),now() + (v_interval * interval '1 day'),case when v_mastery = 100 then now() else null end)
  on conflict (user_id,word_id) do update set
    status = excluded.status,
    correct_answers = public.user_vocabulary.correct_answers + excluded.correct_answers,
    wrong_answers = public.user_vocabulary.wrong_answers + excluded.wrong_answers,
    mastery_score = excluded.mastery_score, review_count = public.user_vocabulary.review_count + 1,
    review_interval_days = excluded.review_interval_days, ease_factor = excluded.ease_factor,
    last_review_at = excluded.last_review_at, next_review_at = excluded.next_review_at,
    learned_at = coalesce(public.user_vocabulary.learned_at, excluded.learned_at);

  select (now() at time zone s.timezone)::date into v_local_date
  from public.user_settings s where s.user_id = v_user;
  select count(*) into v_repeat_count from public.exercise_attempts
  where user_id = v_user and word_id = p_word_id and is_correct and (answered_at at time zone (select timezone from public.user_settings where user_id = v_user))::date = v_local_date;
  select coalesce(sum(amount),0) into v_day_xp from public.xp_transactions
  where user_id = v_user and (created_at at time zone (select timezone from public.user_settings where user_id = v_user))::date = v_local_date;
  if v_correct and v_repeat_count < 3 and v_day_xp < 200 then
    v_xp := least(case when v_word.cefr_level in ('C1','C2') then 8 else 5 end, 200 - v_day_xp);
  end if;
  insert into public.exercise_attempts (user_id,word_id,operation_id,answer,is_correct,awarded_xp,response_time_ms,lesson_id)
  values (v_user,p_word_id,p_operation_id,btrim(p_answer),v_correct,v_xp,p_response_time_ms,p_lesson_id);
  if v_xp > 0 then
    insert into public.xp_transactions (user_id,amount,source_type,source_id,description)
    values (v_user,v_xp,'vocabulary_answer',p_operation_id,'Resposta de vocabulário');
    update public.user_levels set total_xp = total_xp + v_xp, updated_at = now() where user_id = v_user returning total_xp into v_total_xp;
  else select total_xp into v_total_xp from public.user_levels where user_id = v_user; end if;
  v_level := 1;
  while v_level < 100 and floor(250 * power(v_level::numeric, 1.4) + 250 * v_level) <= v_total_xp loop
    v_level := v_level + 1;
  end loop;
  update public.user_levels set level = v_level where user_id = v_user and level <> v_level;

  -- Tempo creditado conservador: uma resposta correta contribui até 30s para a meta.
  v_seconds := case when v_correct then least(30, greatest(10, coalesce(p_response_time_ms,15000) / 1000)) else 0 end;
  insert into public.user_daily_progress (user_id,local_date,activity_seconds,answers,correct_answers,xp_earned)
  values (v_user,v_local_date,v_seconds,1,case when v_correct then 1 else 0 end,v_xp)
  on conflict (user_id,local_date) do update set
    activity_seconds = public.user_daily_progress.activity_seconds + excluded.activity_seconds,
    answers = public.user_daily_progress.answers + 1,
    correct_answers = public.user_daily_progress.correct_answers + excluded.correct_answers,
    xp_earned = public.user_daily_progress.xp_earned + excluded.xp_earned;
  select * into v_daily from public.user_daily_progress where user_id = v_user and local_date = v_local_date;
  select target_minutes * 60 into v_target_seconds from public.daily_goals where user_id = v_user;
  if v_daily.goal_reached_at is null and v_daily.activity_seconds >= v_target_seconds then
    update public.user_daily_progress set goal_reached_at = now() where user_id = v_user and local_date = v_local_date;
    update public.streaks set
      current_days = case when last_goal_date = v_local_date - 1 then current_days + 1 when last_goal_date = v_local_date then current_days else 1 end,
      longest_days = greatest(longest_days, case when last_goal_date = v_local_date - 1 then current_days + 1 when last_goal_date = v_local_date then current_days else 1 end),
      last_goal_date = v_local_date where user_id = v_user;
  end if;
  for v_mission in select * from public.missions where period = 'daily' and metric = 'answers' loop
    insert into public.user_missions (user_id,mission_id,period_start,progress,completed_at)
    values (v_user,v_mission.id,v_local_date,least(v_daily.answers,v_mission.target),
      case when v_daily.answers >= v_mission.target then now() else null end)
    on conflict (user_id,mission_id,period_start) do update set
      progress = excluded.progress,
      completed_at = coalesce(public.user_missions.completed_at, excluded.completed_at);
    select * into v_user_mission from public.user_missions
    where user_id = v_user and mission_id = v_mission.id and period_start = v_local_date for update;
    if v_user_mission.completed_at is not null and v_user_mission.claimed_at is null then
      if v_mission.reward_xp > 0 then
        insert into public.xp_transactions (user_id,amount,source_type,source_id,description)
        values (v_user,v_mission.reward_xp,'mission',v_user_mission.instance_id,v_mission.title);
        update public.user_levels set total_xp = total_xp + v_mission.reward_xp, updated_at = now() where user_id = v_user;
        v_mission_xp := v_mission_xp + v_mission.reward_xp;
      end if;
      if v_mission.reward_coins > 0 then
        insert into public.coin_transactions (user_id,amount,source_type,source_id,description)
        values (v_user,v_mission.reward_coins,'mission',v_user_mission.instance_id,v_mission.title);
        v_coins := v_coins + v_mission.reward_coins;
      end if;
      update public.user_missions set claimed_at = now() where instance_id = v_user_mission.instance_id;
    end if;
  end loop;
  v_week_start := date_trunc('week', v_local_date::timestamp)::date;
  select count(*) into v_study_days from public.user_daily_progress
  where user_id = v_user and local_date between v_week_start and v_week_start + 6
    and answers > 0;
  for v_mission in select * from public.missions where period = 'weekly' and metric = 'study_days' loop
    insert into public.user_missions (user_id,mission_id,period_start,progress,completed_at)
    values (v_user,v_mission.id,v_week_start,least(v_study_days,v_mission.target),
      case when v_study_days >= v_mission.target then now() else null end)
    on conflict (user_id,mission_id,period_start) do update set
      progress = excluded.progress,
      completed_at = coalesce(public.user_missions.completed_at, excluded.completed_at);
    select * into v_user_mission from public.user_missions
    where user_id = v_user and mission_id = v_mission.id and period_start = v_week_start for update;
    if v_user_mission.completed_at is not null and v_user_mission.claimed_at is null then
      if v_mission.reward_xp > 0 then
        insert into public.xp_transactions (user_id,amount,source_type,source_id,description)
        values (v_user,v_mission.reward_xp,'mission',v_user_mission.instance_id,v_mission.title);
        update public.user_levels set total_xp = total_xp + v_mission.reward_xp, updated_at = now() where user_id = v_user;
        v_mission_xp := v_mission_xp + v_mission.reward_xp;
      end if;
      if v_mission.reward_coins > 0 then
        insert into public.coin_transactions (user_id,amount,source_type,source_id,description)
        values (v_user,v_mission.reward_coins,'mission',v_user_mission.instance_id,v_mission.title);
        v_coins := v_coins + v_mission.reward_coins;
      end if;
      update public.user_missions set claimed_at = now() where instance_id = v_user_mission.instance_id;
    end if;
  end loop;
  insert into public.user_achievements (user_id,achievement_id)
  select v_user,id from public.achievements where metric = 'first_answer' and v_correct
  on conflict do nothing;
  insert into public.user_achievements (user_id,achievement_id)
  select v_user,id from public.achievements where metric = 'words_studied'
    and threshold <= (select count(*) from public.user_vocabulary where user_id = v_user)
  on conflict do nothing;
  insert into public.user_achievements (user_id,achievement_id)
  select v_user,a.id from public.achievements a join public.streaks s on s.user_id = v_user
  where a.metric = 'streak_days' and a.threshold <= s.current_days
  on conflict do nothing;
  select total_xp into v_total_xp from public.user_levels where user_id = v_user;
  v_level := 1;
  while v_level < 100 and floor(250 * power(v_level::numeric, 1.4) + 250 * v_level) <= v_total_xp loop
    v_level := v_level + 1;
  end loop;
  update public.user_levels set level = v_level where user_id = v_user and level <> v_level;
  return jsonb_build_object('correct',v_correct,'translation',v_word.translation,'awardedXp',v_xp,
    'missionXp',v_mission_xp,'coinsAwarded',v_coins,'totalXp',v_total_xp,'level',v_level,
    'mastery',v_mastery,'nextReviewAt',now() + (v_interval * interval '1 day'),'duplicate',false);
end;
$$;
revoke all on function public.submit_vocabulary_answer(uuid,text,uuid,integer,uuid) from public;
grant execute on function public.submit_vocabulary_answer(uuid,text,uuid,integer,uuid) to authenticated;

create or replace function public.complete_lesson(p_lesson_id uuid)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare v_user uuid := (select auth.uid()); v_total integer; v_correct integer;
  v_score integer; v_award integer := 0; v_xp integer; v_level integer;
begin
  if v_user is null then raise exception 'Not authenticated' using errcode = '28000'; end if;
  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(v_user::text, 0));
  if not exists (select 1 from public.lessons where id = p_lesson_id and published) then
    raise exception 'Lesson not found' using errcode = '22023';
  end if;
  select count(*) into v_total from public.lesson_exercises where lesson_id = p_lesson_id;
  select count(distinct word_id) into v_correct from public.exercise_attempts
    where user_id = v_user and lesson_id = p_lesson_id and is_correct;
  v_score := case when v_total > 0 then floor(v_correct * 100.0 / v_total) else 0 end;
  if v_total = 0 or v_score < 80 then
    return jsonb_build_object('completed',false,'score',v_score,'requiredScore',80,'awardedXp',0);
  end if;
  insert into public.user_lesson_progress (user_id,lesson_id,correct_answers,total_exercises,completed_at)
  values (v_user,p_lesson_id,v_correct,v_total,now())
  on conflict (user_id,lesson_id) do update set correct_answers = excluded.correct_answers,
    total_exercises = excluded.total_exercises, completed_at = coalesce(public.user_lesson_progress.completed_at, excluded.completed_at);
  insert into public.xp_transactions (user_id,amount,source_type,source_id,description)
  values (v_user,50,'lesson_completion',p_lesson_id,'Lição concluída') on conflict do nothing;
  if found then
    v_award := 50;
    update public.user_levels set total_xp = total_xp + 50, updated_at = now() where user_id = v_user;
    insert into public.coin_transactions (user_id,amount,source_type,source_id,description)
    values (v_user,10,'lesson_completion',p_lesson_id,'Lição concluída') on conflict do nothing;
  end if;
  select total_xp into v_xp from public.user_levels where user_id = v_user;
  v_level := 1;
  while v_level < 100 and floor(250 * power(v_level::numeric, 1.4) + 250 * v_level) <= v_xp loop
    v_level := v_level + 1;
  end loop;
  update public.user_levels set level = v_level where user_id = v_user and level <> v_level;
  insert into public.user_achievements (user_id,achievement_id)
  select v_user,id from public.achievements where metric = 'first_lesson' on conflict do nothing;
  return jsonb_build_object('completed',true,'score',v_score,'awardedXp',v_award,'totalXp',v_xp,'level',v_level);
end;
$$;
revoke all on function public.complete_lesson(uuid) from public;
grant execute on function public.complete_lesson(uuid) to authenticated;

create or replace function public.select_study_words(p_level text, p_review_only boolean default false)
returns setof public.vocabulary_words language sql stable security invoker set search_path = '' as $$
  select w.* from public.vocabulary_words w
  left join public.user_vocabulary uv on uv.word_id = w.id and uv.user_id = (select auth.uid())
  where (uv.next_review_at is not null and uv.next_review_at <= now())
     or (not p_review_only and uv.word_id is null and w.cefr_level = p_level)
  order by case when uv.next_review_at <= now() then 0 else 1 end,
           uv.next_review_at nulls last, w.frequency_rank nulls last, w.id
  limit 10;
$$;
revoke all on function public.select_study_words(text,boolean) from public;
grant execute on function public.select_study_words(text,boolean) to authenticated;


-- Conteúdo inicial curado. Reexecutar é seguro: slugs e word_key impedem duplicatas.
insert into public.vocabulary_categories (slug,name) values
('daily-life','Vida cotidiana'),('family','Família'),('food','Comida'),
('travel','Viagens'),('work','Trabalho'),('technology','Tecnologia'),
('feelings','Sentimentos'),('nature','Natureza')
on conflict (slug) do update set name = excluded.name;

insert into public.vocabulary_words
  (word,translation,definition_en,example_en,cefr_level,word_type,category_id,frequency_rank)
select v.word,v.translation,v.definition_en,v.example_en,v.cefr_level,v.word_type,c.id,v.frequency_rank
from (values
('hello','olá','A greeting used when meeting someone.','Hello, my name is Ana.','A1','expression','daily-life',1),
('goodbye','adeus','A word said when leaving.','Goodbye, see you tomorrow.','A1','expression','daily-life',2),
('thank you','obrigado','Words used to show gratitude.','Thank you for your help.','A1','expression','daily-life',3),
('please','por favor','A polite word used when asking.','Please open the door.','A1','expression','daily-life',4),
('yes','sim','A positive answer.','Yes, I can help.','A1','adverb','daily-life',5),
('no','não','A negative answer.','No, I am not hungry.','A1','adverb','daily-life',6),
('friend','amigo','A person you like and know well.','My friend lives nearby.','A1','noun','family',7),
('family','família','People related to one another.','My family is very kind.','A1','noun','family',8),
('mother','mãe','A female parent.','My mother likes music.','A1','noun','family',9),
('father','pai','A male parent.','My father is at home.','A1','noun','family',10),
('water','água','A clear liquid that people drink.','I drink water every day.','A1','noun','food',11),
('bread','pão','A food made from baked dough.','We eat bread for breakfast.','A1','noun','food',12),
('apple','maçã','A round fruit with red or green skin.','She eats an apple.','A1','noun','food',13),
('house','casa','A building where people live.','Their house is small.','A1','noun','daily-life',14),
('school','escola','A place where people learn.','The school opens at eight.','A1','noun','daily-life',15),
('book','livro','A set of pages with words or pictures.','This book is interesting.','A1','noun','daily-life',16),
('work','trabalho','An activity done as a job.','I go to work by bus.','A1','noun','work',17),
('happy','feliz','Feeling pleasure or joy.','I am happy today.','A1','adjective','feelings',18),
('sad','triste','Feeling unhappy.','He feels sad today.','A1','adjective','feelings',19),
('city','cidade','A large town.','This city has many parks.','A1','noun','travel',20),
('train','trem','A vehicle that travels on tracks.','The train leaves at noon.','A2','noun','travel',21),
('ticket','passagem','A document that allows travel or entry.','I bought a train ticket.','A2','noun','travel',22),
('airport','aeroporto','A place where aircraft arrive and leave.','We arrived at the airport early.','A2','noun','travel',23),
('journey','jornada','The act of travelling from one place to another.','Our journey begins today.','A2','noun','travel',24),
('weather','clima','The conditions outside at a time.','The weather is warm today.','A2','noun','nature',25),
('meeting','reunião','An event where people discuss things.','The meeting starts at nine.','A2','noun','work',26),
('answer','resposta','Something said in reply to a question.','Her answer was correct.','A2','noun','daily-life',27),
('question','pergunta','Words used to ask for information.','I have a question.','A2','noun','daily-life',28),
('improve','melhorar','To become better.','I want to improve my English.','A2','verb','daily-life',29),
('practice','praticar','To do something repeatedly to improve.','We practice every morning.','A2','verb','daily-life',30),
('develop','desenvolver','To create or grow something over time.','They develop useful tools.','B1','verb','technology',31),
('software','programa','Computer programs and related data.','This software helps students.','B1','noun','technology',32),
('database','banco de dados','An organized collection of data.','The database stores user profiles.','B1','noun','technology',33),
('request','solicitação','An act of asking for something.','The server received the request.','B1','noun','technology',34),
('response','resposta do servidor','A reply to a request.','The response contains the result.','B1','noun','technology',35),
('feature','funcionalidade','A distinctive part of a product.','The new feature helps learners.','B1','noun','technology',36),
('bug','erro de software','A problem in a computer program.','We fixed a bug in the app.','B1','noun','technology',37),
('branch','ramificação','A separate line of development.','Create a branch before editing.','B1','noun','technology',38),
('commit','registro de alteração','A saved change in a version system.','The commit includes the fix.','B1','noun','technology',39),
('deploy','implantar','To make software available for use.','We deploy the app today.','B1','verb','technology',40),
('deadline','prazo final','The latest time something must be done.','The deadline is next Friday.','B2','noun','work',41),
('negotiate','negociar','To discuss in order to reach agreement.','They negotiate the contract.','B2','verb','work',42),
('reliable','confiável','Able to be trusted to work well.','The service is reliable.','B2','adjective','work',43),
('efficient','eficiente','Working well without wasted effort.','This method is efficient.','B2','adjective','work',44),
('ambiguous','ambíguo','Having more than one possible meaning.','The instruction is ambiguous.','C1','adjective','work',45),
('resilience','resiliência','The ability to recover from difficulty.','Resilience helps during change.','C1','noun','feelings',46),
('nuance','nuance','A small difference in meaning or feeling.','The translation misses a nuance.','C1','noun','daily-life',47),
('substantiate','comprovar','To provide evidence for a claim.','Please substantiate your answer.','C1','verb','work',48),
('ubiquitous','onipresente','Present or found everywhere.','Mobile devices are ubiquitous.','C2','adjective','technology',49),
('equivocal','equívoco','Open to more than one interpretation.','His response was equivocal.','C2','adjective','work',50),
('pervasive','generalizado','Spreading widely through something.','The influence is pervasive.','C2','adjective','daily-life',51),
('conundrum','enigma','A confusing and difficult problem.','The puzzle became a conundrum.','C2','noun','daily-life',52)
) as v(word,translation,definition_en,example_en,cefr_level,word_type,category_slug,frequency_rank)
join public.vocabulary_categories c on c.slug = v.category_slug
on conflict (word_key) do update set
  translation = excluded.translation, definition_en = excluded.definition_en,
  example_en = excluded.example_en, cefr_level = excluded.cefr_level,
  word_type = excluded.word_type, category_id = excluded.category_id,
  frequency_rank = excluded.frequency_rank, updated_at = now();

insert into public.achievements (slug,title,description,rarity,metric,threshold) values
('first-answer','Primeiros Passos','Acerte sua primeira palavra.','common','first_answer',1),
('vocabulary-100','Vocabulário 100','Estude 100 palavras.','rare','words_studied',100),
('streak-7','Uma Semana','Atinja a meta por 7 dias seguidos.','rare','streak_days',7)
,
('first-lesson','Primeira Lição','Conclua sua primeira lição.','common','first_lesson',1)
on conflict (slug) do update set title = excluded.title, description = excluded.description;

insert into public.missions (slug,title,period,metric,target,reward_xp,reward_coins) values
('answer-5','Responda 5 palavras','daily','answers',5,20,10),
('answer-20','Responda 20 palavras','daily','answers',20,50,25),
('study-5-days','Estude 5 dias','weekly','study_days',5,100,50)
on conflict (slug) do update set title = excluded.title, target = excluded.target;

insert into public.tracks (slug,title,description,cefr_level,published) values
('english-basics','Inglês Básico','Vocabulário e frases do dia a dia.','A1',true),
('english-intermediate','Inglês Intermediário','Expanda sua comunicação.','B1',true),
('english-for-developers','Inglês para Programadores','Comunique-se melhor em tecnologia.','B1',true)
on conflict (slug) do update set title = excluded.title, description = excluded.description, published = true;

insert into public.modules (track_id,title,position)
select id,'Introdução',1 from public.tracks where slug = 'english-basics'
on conflict (track_id,position) do update set title = excluded.title;
insert into public.modules (track_id,title,position)
select id,'Comunicação no trabalho',1 from public.tracks where slug = 'english-intermediate'
on conflict (track_id,position) do update set title = excluded.title;
insert into public.modules (track_id,title,position)
select id,'Git e desenvolvimento',1 from public.tracks where slug = 'english-for-developers'
on conflict (track_id,position) do update set title = excluded.title;

insert into public.lessons (module_id,title,description,position,published)
select m.id,'Primeiras palavras','Saudações e palavras essenciais.',1,true from public.modules m join public.tracks t on t.id = m.track_id where t.slug = 'english-basics' and m.position = 1
on conflict (module_id,position) do update set title = excluded.title, published = true;
insert into public.lessons (module_id,title,description,position,published)
select m.id,'Rotina e família','Fale sobre pessoas e hábitos.',2,true from public.modules m join public.tracks t on t.id = m.track_id where t.slug = 'english-basics' and m.position = 1
on conflict (module_id,position) do update set title = excluded.title, published = true;
insert into public.lessons (module_id,title,description,position,published)
select m.id,'Software e Git','Palavras frequentes na programação.',1,true from public.modules m join public.tracks t on t.id = m.track_id where t.slug = 'english-for-developers' and m.position = 1
on conflict (module_id,position) do update set title = excluded.title, published = true;

insert into public.lesson_exercises (lesson_id,word_id,position)
select l.id,w.id,row_number() over (partition by l.id order by w.frequency_rank)
from public.lessons l join public.modules m on m.id = l.module_id join public.tracks t on t.id = m.track_id
join public.vocabulary_words w on
  (t.slug = 'english-basics' and l.position = 1 and w.frequency_rank between 1 and 6)
  or (t.slug = 'english-basics' and l.position = 2 and w.frequency_rank between 7 and 12)
  or (t.slug = 'english-for-developers' and w.frequency_rank between 31 and 40)
where l.published
on conflict (lesson_id,position) do nothing;

