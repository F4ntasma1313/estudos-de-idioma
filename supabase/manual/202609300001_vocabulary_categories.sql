-- Execute antes dos lotes do catálogo. Reexecutar é seguro.
insert into public.vocabulary_categories (slug, name) values
  ('general-vocabulary', 'Vocabulário geral'),
  ('science', 'Ciência'),
  ('health', 'Saúde'),
  ('technical', 'Termos técnicos'),
  ('arts', 'Artes'),
  ('law', 'Direito'),
  ('business', 'Negócios'),
  ('politics', 'Política'),
  ('sports', 'Esportes')
on conflict (slug) do update set name = excluded.name;
