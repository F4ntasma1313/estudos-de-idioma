-- Completa as quatro palavras do conteúdo inicial ausentes do catálogo de 20 mil.
-- Execute após os dez lotes bilíngues. Pode ser reexecutado.
begin;
update public.vocabulary_words
set definition_pt = case word_key
    when 'thank you' then 'Expressão usada para demonstrar gratidão.'
    when 'no' then 'Uma resposta negativa.'
    when 'reliable' then 'Em que se pode confiar para funcionar bem.'
    when 'substantiate' then 'Apresentar evidências para sustentar uma afirmação.'
  end,
  example_pt = case word_key
    when 'thank you' then 'Obrigado pela sua ajuda.'
    when 'no' then 'Não, não estou com fome.'
    when 'reliable' then 'O serviço é confiável.'
    when 'substantiate' then 'Por favor, comprove sua resposta.'
  end,
  updated_at = now()
where word_key in ('thank you', 'no', 'reliable', 'substantiate');
commit;
