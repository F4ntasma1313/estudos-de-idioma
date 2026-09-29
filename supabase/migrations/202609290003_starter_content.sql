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
