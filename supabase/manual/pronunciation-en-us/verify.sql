-- Execute depois dos dez lotes. Com todo o catálogo importado, espera-se
-- pelo menos 20.004 palavras com pronúncia e nenhuma palavra sem ela.
select
  count(*) as total_words,
  count(*) filter (where phonetic is not null and btrim(phonetic) <> '') as words_with_pronunciation,
  count(*) filter (where phonetic is null or btrim(phonetic) = '') as words_without_pronunciation
from public.vocabulary_words;
