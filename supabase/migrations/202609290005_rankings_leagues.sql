-- Ranking público opt-in e ligas semanais. Executar após 202609290004_reading_writing.sql.
create table public.leagues (
  id smallint primary key check (id between 1 and 6), slug text not null unique,
  title text not null, position smallint not null unique check (position between 1 and 6)
);
insert into public.leagues (id,slug,title,position) values
(1,'bronze','Bronze',1),(2,'silver','Prata',2),(3,'gold','Ouro',3),
(4,'platinum','Platina',4),(5,'diamond','Diamante',5),(6,'master','Master',6);

create table public.league_memberships (
  user_id uuid not null references auth.users(id) on delete cascade,
  week_start date not null, league_id smallint not null references public.leagues(id),
  joined_at timestamptz not null default now(), primary key (user_id,week_start)
);
create index league_memberships_week_league_idx on public.league_memberships (week_start,league_id,user_id);
alter table public.leagues enable row level security;
alter table public.league_memberships enable row level security;
create policy leagues_read on public.leagues for select to authenticated using (true);
create policy memberships_read_own on public.league_memberships for select to authenticated
  using ((select auth.uid()) = user_id);

create or replace function public.get_public_ranking(p_period text default 'weekly', p_metric text default 'xp')
returns jsonb language plpgsql stable security definer set search_path = '' as $$
declare v_start timestamptz; v_result jsonb;
begin
  if (select auth.uid()) is null then raise exception 'Not authenticated' using errcode = '28000'; end if;
  if p_period not in ('daily','weekly','monthly','global') or p_metric not in ('xp','words','streak') then
    raise exception 'Invalid ranking filter' using errcode = '22023';
  end if;
  v_start := case p_period
    when 'daily' then date_trunc('day',now() at time zone 'UTC') at time zone 'UTC'
    when 'weekly' then date_trunc('week',now() at time zone 'UTC') at time zone 'UTC'
    when 'monthly' then date_trunc('month',now() at time zone 'UTC') at time zone 'UTC'
    else null end;
  with eligible as (
    select s.user_id,p.display_name from public.user_settings s
      join public.profiles p on p.user_id = s.user_id where s.ranking_public
  ), scores as (
    select e.user_id,e.display_name,
      case p_metric
        when 'xp' then (select coalesce(sum(x.amount),0) from public.xp_transactions x
          where x.user_id = e.user_id and (v_start is null or x.created_at >= v_start))
        when 'words' then (select count(*) from public.user_vocabulary v
          where v.user_id = e.user_id and v.learned_at is not null
            and (v_start is null or v.learned_at >= v_start))
        else (select coalesce(current_days,0) from public.streaks where user_id = e.user_id)
      end::integer as score
    from eligible e
  ), ranked as (
    select user_id,display_name,score,row_number() over (order by score desc,display_name,user_id) as place
    from scores where score > 0
  )
  select coalesce(jsonb_agg(jsonb_build_object('userId',user_id,'name',display_name,
    'score',score,'place',place) order by place),'[]'::jsonb) into v_result
  from (select * from ranked order by place limit 50) top_scores;
  return v_result;
end;
$$;
revoke all on function public.get_public_ranking(text,text) from public;
grant execute on function public.get_public_ranking(text,text) to authenticated;

create or replace function public.ensure_league_membership()
returns jsonb language plpgsql security definer set search_path = '' as $$
declare v_user uuid := (select auth.uid()); v_week date;
  v_league smallint := 1; v_previous public.league_memberships%rowtype;
  v_rank integer; v_count integer; v_my_xp integer;
begin
  if v_user is null then raise exception 'Not authenticated' using errcode = '28000'; end if;
  if not exists (select 1 from public.user_settings where user_id = v_user and ranking_public) then
    return jsonb_build_object('participating',false);
  end if;
  v_week := date_trunc('week',now() at time zone 'UTC')::date;
  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(v_user::text, 0));
  select league_id into v_league from public.league_memberships
    where user_id = v_user and week_start = v_week;
  if not found then
    select * into v_previous from public.league_memberships
      where user_id = v_user and week_start < v_week order by week_start desc limit 1;
    v_league := coalesce(v_previous.league_id,1);
    if v_previous.week_start = v_week - 7 then
      with scores as (
        select m.user_id,coalesce(sum(x.amount),0)::integer as xp
        from public.league_memberships m left join public.xp_transactions x
          on x.user_id = m.user_id and x.created_at >= ((v_week - 7)::timestamp at time zone 'UTC')
            and x.created_at < (v_week::timestamp at time zone 'UTC')
        where m.week_start = v_week - 7 and m.league_id = v_previous.league_id
        group by m.user_id
      ), ranked as (
        select user_id,xp,row_number() over (order by xp desc,user_id) as place,
          count(*) over () as participants from scores
      )
      select place,participants,xp into v_rank,v_count,v_my_xp from ranked where user_id = v_user;
      if v_count >= 5 and v_my_xp > 0 and v_rank <= ceil(v_count * 0.20) then
        v_league := least(6,v_league + 1);
      elsif v_count >= 10 and v_my_xp > 0 and v_rank > floor(v_count * 0.90) then
        v_league := greatest(1,v_league - 1);
      end if;
    end if;
    insert into public.league_memberships (user_id,week_start,league_id)
      values (v_user,v_week,v_league) on conflict (user_id,week_start) do nothing;
  end if;
  return jsonb_build_object('participating',true,'leagueId',v_league,'weekStart',v_week,
    'leagueName',(select title from public.leagues where id = v_league));
end;
$$;
revoke all on function public.ensure_league_membership() from public;
grant execute on function public.ensure_league_membership() to authenticated;

create or replace function public.get_league_board()
returns jsonb language plpgsql security definer set search_path = '' as $$
declare v_membership jsonb; v_user uuid := (select auth.uid()); v_league smallint;
  v_week date; v_result jsonb;
begin
  if v_user is null then raise exception 'Not authenticated' using errcode = '28000'; end if;
  v_membership := public.ensure_league_membership();
  if not (v_membership ->> 'participating')::boolean then
    return jsonb_build_object('membership',v_membership,'rows','[]'::jsonb);
  end if;
  v_league := (v_membership ->> 'leagueId')::smallint;
  v_week := (v_membership ->> 'weekStart')::date;
  with scores as (
    select m.user_id,p.display_name,coalesce(sum(x.amount),0)::integer as xp
    from public.league_memberships m join public.user_settings s on s.user_id = m.user_id and s.ranking_public
    join public.profiles p on p.user_id = m.user_id
    left join public.xp_transactions x on x.user_id = m.user_id
      and x.created_at >= (v_week::timestamp at time zone 'UTC')
      and x.created_at < ((v_week + 7)::timestamp at time zone 'UTC')
    where m.week_start = v_week and m.league_id = v_league
    group by m.user_id,p.display_name
  ), ranked as (
    select user_id,display_name,xp,row_number() over (order by xp desc,display_name,user_id) as place
    from scores
  )
  select coalesce(jsonb_agg(jsonb_build_object('userId',user_id,'name',display_name,
    'score',xp,'place',place) order by place),'[]'::jsonb) into v_result
  from (select * from ranked order by place limit 50) top_scores;
  return jsonb_build_object('membership',v_membership,'rows',v_result);
end;
$$;
revoke all on function public.get_league_board() from public;
grant execute on function public.get_league_board() to authenticated;
