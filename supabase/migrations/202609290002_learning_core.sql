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
