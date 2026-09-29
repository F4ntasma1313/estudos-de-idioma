-- Prática de leitura e escrita. Executar depois de 202609290003_starter_content.sql.
create table public.reading_passages (
  id uuid primary key default gen_random_uuid(), slug text not null unique,
  title text not null, body_en text not null, cefr_level text not null
    check (cefr_level in ('A1','A2','B1','B2','C1','C2')),
  published boolean not null default false, created_at timestamptz not null default now()
);
create table public.reading_questions (
  id uuid primary key default gen_random_uuid(),
  passage_id uuid not null references public.reading_passages(id) on delete cascade,
  position integer not null check (position > 0), prompt_pt text not null,
  options jsonb not null check (jsonb_typeof(options) = 'array' and jsonb_array_length(options) = 4),
  correct_index smallint not null check (correct_index between 0 and 3),
  explanation_pt text not null, unique (passage_id,position)
);
create table public.reading_attempts (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade,
  question_id uuid not null references public.reading_questions(id),
  selected_index smallint not null check (selected_index between 0 and 3),
  is_correct boolean not null, awarded_xp smallint not null default 0,
  answered_at timestamptz not null default now(), unique (user_id,question_id)
);
create index reading_attempts_user_date_idx on public.reading_attempts (user_id,answered_at desc);

create table public.writing_challenges (
  id uuid primary key default gen_random_uuid(), slug text not null unique,
  title text not null, prompt_pt text not null, cefr_level text not null
    check (cefr_level in ('A1','A2','B1','B2','C1','C2')),
  min_words integer not null check (min_words between 10 and 500),
  published boolean not null default false
);
create table public.writing_submissions (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade,
  challenge_id uuid not null references public.writing_challenges(id),
  body_en text not null check (char_length(body_en) between 30 and 5000),
  word_count integer not null check (word_count >= 0),
  submitted_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  unique (user_id,challenge_id)
);

alter table public.reading_passages enable row level security;
alter table public.reading_questions enable row level security;
alter table public.reading_attempts enable row level security;
alter table public.writing_challenges enable row level security;
alter table public.writing_submissions enable row level security;
create policy reading_passages_select_published on public.reading_passages
  for select to authenticated using (published);
create policy reading_attempts_select_own on public.reading_attempts
  for select to authenticated using ((select auth.uid()) = user_id);
create policy writing_challenges_select_published on public.writing_challenges
  for select to authenticated using (published);
create policy writing_submissions_select_own on public.writing_submissions
  for select to authenticated using ((select auth.uid()) = user_id);
-- reading_questions.correct_index não é exposto pelo PostgREST.

create or replace function public.get_reading_questions(p_passage_id uuid)
returns jsonb language plpgsql stable security definer set search_path = '' as $$
declare v_result jsonb;
begin
  if (select auth.uid()) is null then raise exception 'Not authenticated' using errcode = '28000'; end if;
  if not exists (select 1 from public.reading_passages where id = p_passage_id and published) then
    raise exception 'Passage not found' using errcode = '22023';
  end if;
  select coalesce(jsonb_agg(jsonb_build_object('id',id,'prompt',prompt_pt,'options',options,'position',position) order by position),'[]'::jsonb)
    into v_result from public.reading_questions where passage_id = p_passage_id;
  return v_result;
end;
$$;
revoke all on function public.get_reading_questions(uuid) from public;
grant execute on function public.get_reading_questions(uuid) to authenticated;

create or replace function public.submit_reading_answer(p_question_id uuid, p_option_index integer)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  v_user uuid := (select auth.uid()); v_question public.reading_questions%rowtype;
  v_attempt public.reading_attempts%rowtype; v_correct boolean; v_xp integer := 0;
  v_local_date date; v_day_xp integer; v_total_xp integer; v_level integer := 1;
begin
  if v_user is null then raise exception 'Not authenticated' using errcode = '28000'; end if;
  if p_option_index not between 0 and 3 then raise exception 'Invalid option' using errcode = '22023'; end if;
  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(v_user::text, 0));
  select q.* into v_question from public.reading_questions q
    join public.reading_passages p on p.id = q.passage_id and p.published
    where q.id = p_question_id;
  if not found then raise exception 'Question not found' using errcode = '22023'; end if;
  select * into v_attempt from public.reading_attempts where user_id = v_user and question_id = p_question_id;
  if found then
    return jsonb_build_object('correct',v_attempt.is_correct,'awardedXp',v_attempt.awarded_xp,
      'explanation',v_question.explanation_pt,'correctIndex',v_question.correct_index,'duplicate',true);
  end if;
  v_correct := p_option_index = v_question.correct_index;
  select (now() at time zone s.timezone)::date into v_local_date
    from public.user_settings s where s.user_id = v_user;
  select coalesce(sum(amount),0) into v_day_xp from public.xp_transactions
    where user_id = v_user and (created_at at time zone
      (select timezone from public.user_settings where user_id = v_user))::date = v_local_date;
  if v_correct then v_xp := least(5, greatest(0, 200 - v_day_xp)); end if;
  insert into public.reading_attempts (user_id,question_id,selected_index,is_correct,awarded_xp)
    values (v_user,p_question_id,p_option_index,v_correct,v_xp);
  if v_xp > 0 then
    insert into public.xp_transactions (user_id,amount,source_type,source_id,description)
      values (v_user,v_xp,'reading_question',p_question_id,'Questão de leitura');
    update public.user_levels set total_xp = total_xp + v_xp, updated_at = now() where user_id = v_user;
  end if;
  insert into public.user_daily_progress (user_id,local_date,activity_seconds,answers,correct_answers,xp_earned)
    values (v_user,v_local_date,30,1,case when v_correct then 1 else 0 end,v_xp)
    on conflict (user_id,local_date) do update set
      activity_seconds = public.user_daily_progress.activity_seconds + 30,
      answers = public.user_daily_progress.answers + 1,
      correct_answers = public.user_daily_progress.correct_answers + excluded.correct_answers,
      xp_earned = public.user_daily_progress.xp_earned + excluded.xp_earned;
  if exists (select 1 from public.user_daily_progress p join public.daily_goals g on g.user_id = p.user_id
    where p.user_id = v_user and p.local_date = v_local_date and p.goal_reached_at is null
      and p.activity_seconds >= g.target_minutes * 60) then
    update public.user_daily_progress set goal_reached_at = now() where user_id = v_user and local_date = v_local_date;
    update public.streaks set current_days = case when last_goal_date = v_local_date - 1 then current_days + 1 else 1 end,
      longest_days = greatest(longest_days, case when last_goal_date = v_local_date - 1 then current_days + 1 else 1 end),
      last_goal_date = v_local_date where user_id = v_user;
  end if;
  select total_xp into v_total_xp from public.user_levels where user_id = v_user;
  while v_level < 100 and floor(250 * power(v_level::numeric,1.4) + 250 * v_level) <= v_total_xp loop
    v_level := v_level + 1;
  end loop;
  update public.user_levels set level = v_level where user_id = v_user and level <> v_level;
  return jsonb_build_object('correct',v_correct,'awardedXp',v_xp,'explanation',v_question.explanation_pt,
    'correctIndex',v_question.correct_index,'totalXp',v_total_xp,'level',v_level,'duplicate',false);
end;
$$;
revoke all on function public.submit_reading_answer(uuid,integer) from public;
grant execute on function public.submit_reading_answer(uuid,integer) to authenticated;

create or replace function public.submit_writing(p_challenge_id uuid, p_body_en text)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare v_user uuid := (select auth.uid()); v_challenge public.writing_challenges%rowtype;
  v_words integer; v_submission_id uuid;
begin
  if v_user is null then raise exception 'Not authenticated' using errcode = '28000'; end if;
  select * into v_challenge from public.writing_challenges where id = p_challenge_id and published;
  if not found then raise exception 'Challenge not found' using errcode = '22023'; end if;
  if p_body_en is null or char_length(btrim(p_body_en)) not between 30 and 5000 then
    raise exception 'Invalid writing length' using errcode = '22023';
  end if;
  v_words := array_length(regexp_split_to_array(btrim(p_body_en),'\s+'),1);
  if v_words < v_challenge.min_words then raise exception 'Too few words' using errcode = '22023'; end if;
  insert into public.writing_submissions (user_id,challenge_id,body_en,word_count)
    values (v_user,p_challenge_id,btrim(p_body_en),v_words)
    on conflict (user_id,challenge_id) do update set body_en = excluded.body_en,
      word_count = excluded.word_count, updated_at = now()
    returning id into v_submission_id;
  return jsonb_build_object('id',v_submission_id,'wordCount',v_words);
end;
$$;
revoke all on function public.submit_writing(uuid,text) from public;
grant execute on function public.submit_writing(uuid,text) to authenticated;

insert into public.reading_passages (slug,title,body_en,cefr_level,published) values
('morning-routine','My Morning Routine','Every morning, Ana wakes up at seven. She drinks water and eats bread with her family. Then she takes the bus to school. At school, she reads a book and meets her friends.','A1',true),
('weekend-trip','A Weekend Trip','Last Saturday, Bruno travelled by train to a small city. He bought a ticket at the station and checked the weather before leaving. The journey took two hours. In the afternoon, he visited a museum and tried a local dessert.','A2',true),
('team-meeting','A Product Team Meeting','The team met on Monday to discuss a new software feature. Maria explained the customer request, while Daniel showed a prototype. They agreed to test the design with users before starting development. Everyone left the meeting with one clear task.','B1',true),
('remote-work','Working Across Time Zones','Remote teams often collaborate across several time zones. Clear written updates reduce unnecessary meetings, but they cannot replace every conversation. When a decision is complex, a short call may prevent misunderstandings. Teams that document their choices can also help new colleagues understand the reasons behind them.','B2',true),
('evidence-and-policy','Evidence in Public Decisions','Public decisions are stronger when their assumptions are explicit and their evidence can be checked. A policy may seem effective in one community yet have a different outcome elsewhere. Researchers therefore compare contexts, question measurement methods and acknowledge uncertainty. Such caution does not prevent action; it helps institutions revise policies when new evidence appears.','C1',true),
('language-and-nuance','The Nuance of Translation','A translation can preserve the literal meaning of a sentence while altering its tone. Irony, register and cultural associations rarely align perfectly across languages. A skilled translator weighs these competing demands rather than treating each word as an isolated unit. The result is an interpretation that aims to carry the speaker’s intent into a different linguistic world.','C2',true)
on conflict (slug) do update set title = excluded.title, body_en = excluded.body_en, published = true;

insert into public.reading_questions (passage_id,position,prompt_pt,options,correct_index,explanation_pt)
select p.id,1,q.prompt_pt,q.options::jsonb,q.correct_index,q.explanation_pt
from (values
('morning-routine','Como Ana vai à escola?','["De ônibus","De trem","A pé","De bicicleta"]',0,'O texto diz que ela pega o ônibus para ir à escola.'),
('weekend-trip','Quanto tempo durou a viagem?','["Uma hora","Duas horas","Três horas","Um dia"]',1,'A viagem de trem durou duas horas.'),
('team-meeting','O que o time decidiu fazer antes de desenvolver?','["Lançar o produto","Contratar pessoas","Testar com usuários","Mudar de empresa"]',2,'O grupo decidiu testar o design com usuários.'),
('remote-work','Qual prática ajuda novos colegas a entender decisões?','["Evitar reuniões","Documentar escolhas","Trabalhar sempre sozinho","Ignorar fusos"]',1,'Registrar as decisões explica os motivos para quem chega depois.'),
('evidence-and-policy','Por que pesquisadores comparam contextos?','["Para evitar qualquer ação","Porque resultados podem mudar entre comunidades","Para eliminar toda incerteza","Porque medição não importa"]',1,'O mesmo programa pode ter resultados diferentes em outros contextos.'),
('language-and-nuance','O que um tradutor precisa considerar além do sentido literal?','["Somente a contagem de palavras","A fonte tipográfica","Tom, registro e associações culturais","A velocidade de leitura"]',2,'Tom e associações culturais nem sempre coincidem entre idiomas.')
) as q(slug,prompt_pt,options,correct_index,explanation_pt)
join public.reading_passages p on p.slug = q.slug
on conflict (passage_id,position) do update set prompt_pt = excluded.prompt_pt, options = excluded.options,
  correct_index = excluded.correct_index, explanation_pt = excluded.explanation_pt;

insert into public.writing_challenges (slug,title,prompt_pt,cefr_level,min_words,published) values
('introduce-yourself','Apresente-se','Escreva em inglês sobre seu nome, sua cidade e algo de que você gosta.','A1',20,true),
('weekend-plans','Planos para o fim de semana','Descreva seus planos para o próximo fim de semana em inglês.','A2',30,true),
('a-helpful-tool','Uma ferramenta útil','Explique em inglês como uma ferramenta digital ajuda você a estudar ou trabalhar.','B1',45,true),
('remote-collaboration','Colaboração remota','Compare em inglês duas práticas que tornam uma equipe remota mais eficiente.','B2',60,true),
('evaluate-evidence','Avaliar evidências','Discuta em inglês como avaliar uma afirmação antes de tomar uma decisão importante.','C1',80,true),
('translation-nuance','Nuances da tradução','Analise em inglês um exemplo em que uma tradução literal perde parte do sentido original.','C2',100,true)
on conflict (slug) do update set title = excluded.title, prompt_pt = excluded.prompt_pt,
  min_words = excluded.min_words, published = true;
