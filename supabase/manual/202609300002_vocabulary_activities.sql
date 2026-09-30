-- Execute depois dos dez lotes catalog-01.sql a catalog-10.sql.
-- Cada palavra entra em uma atividade de 25 palavras, separada por nível CEFR.
begin;

do $$
begin
  if (select count(*) from public.vocabulary_words) < 20000 then
    raise exception 'Catálogo incompleto: importe os dez lotes antes das atividades';
  end if;
end $$;

create temporary table catalog_activity_plan on commit drop as
select w.id as word_id, w.cefr_level,
       row_number() over (
         partition by w.cefr_level
         order by w.frequency_rank nulls last, w.word_key
       )::integer as sequence_no
from public.vocabulary_words w;

insert into public.tracks (slug, title, description, cefr_level, published) values
  ('catalog-a1', 'A1 · Básico', 'Atividades de vocabulário básico.', 'A1', true),
  ('catalog-a2', 'A2 · Elementar', 'Atividades de vocabulário elementar.', 'A2', true),
  ('catalog-b1', 'B1 · Intermediário', 'Atividades de vocabulário intermediário.', 'B1', true),
  ('catalog-b2', 'B2 · Intermediário alto', 'Atividades de vocabulário intermediário alto.', 'B2', true),
  ('catalog-c1', 'C1 · Avançado', 'Atividades de vocabulário avançado.', 'C1', true),
  ('catalog-c2', 'C2 · Proficiente', 'Atividades de vocabulário proficiente.', 'C2', true)
on conflict (slug) do update set title = excluded.title,
  description = excluded.description, cefr_level = excluded.cefr_level,
  published = true;

insert into public.modules (track_id, title, position)
select t.id, 'Bloco ' || p.module_position, p.module_position
from (
  select distinct cefr_level, ((sequence_no - 1) / 200) + 1 as module_position
  from catalog_activity_plan
) p
join public.tracks t on t.slug = 'catalog-' || lower(p.cefr_level)
on conflict (track_id, position) do update set title = excluded.title;

insert into public.lessons (module_id, title, description, position, published)
select m.id,
       'Atividade ' || (((p.sequence_no - 1) / 25) + 1),
       'Pratique até 25 palavras do nível ' || p.cefr_level || '.',
       (((p.sequence_no - 1) % 200) / 25) + 1,
       true
from (
  select distinct cefr_level, ((sequence_no - 1) / 25) * 25 + 1 as sequence_no
  from catalog_activity_plan
) p
join public.tracks t on t.slug = 'catalog-' || lower(p.cefr_level)
join public.modules m on m.track_id = t.id
  and m.position = ((p.sequence_no - 1) / 200) + 1
on conflict (module_id, position) do update set
  title = excluded.title, description = excluded.description, published = true;

insert into public.lesson_exercises (lesson_id, word_id, position)
select l.id, p.word_id, ((p.sequence_no - 1) % 25) + 1
from catalog_activity_plan p
join public.tracks t on t.slug = 'catalog-' || lower(p.cefr_level)
join public.modules m on m.track_id = t.id
  and m.position = ((p.sequence_no - 1) / 200) + 1
join public.lessons l on l.module_id = m.id
  and l.position = (((p.sequence_no - 1) % 200) / 25) + 1
on conflict (lesson_id, word_id) do nothing;

-- O filtro do estudo e da revisão deve respeitar o nível escolhido.
create or replace function public.select_study_words(p_level text, p_review_only boolean default false)
returns setof public.vocabulary_words
language sql stable security invoker set search_path = '' as $$
  select w.* from public.vocabulary_words w
  left join public.user_vocabulary uv on uv.word_id = w.id and uv.user_id = (select auth.uid())
  where w.cefr_level = p_level
    and ((uv.next_review_at is not null and uv.next_review_at <= now())
      or (not p_review_only and uv.word_id is null))
  order by case when uv.next_review_at <= now() then 0 else 1 end,
           uv.next_review_at nulls last, w.frequency_rank nulls last, w.word_key
  limit 10;
$$;
revoke all on function public.select_study_words(text,boolean) from public;
grant execute on function public.select_study_words(text,boolean) to authenticated;

commit;

-- Confirme uma linha por nível e a soma de pelo menos 20.000 exercícios.
select t.cefr_level, count(distinct l.id) as atividades, count(e.id) as palavras
from public.tracks t
join public.modules m on m.track_id = t.id
join public.lessons l on l.module_id = m.id
join public.lesson_exercises e on e.lesson_id = l.id
where t.slug like 'catalog-%'
group by t.cefr_level
order by t.cefr_level;
