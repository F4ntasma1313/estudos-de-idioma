# Ranking e ligas

A participação é voluntária. A configuração `user_settings.ranking_public` começa como `false`; enquanto estiver desativada, o usuário não aparece no ranking público nem na tabela da liga. As funções SQL retornam apenas nome de exibição, ID público e métricas agregadas de participantes que optaram por aparecer. Não retornam e-mail.

O ranking compara XP, palavras dominadas e sequência de dias. Os períodos diário, semanal e mensal usam limites em UTC; a visão geral considera todo o histórico. A lista mostra os 50 primeiros participantes com pontuação positiva. `get_public_ranking` faz a agregação no banco e valida período/métrica.

A liga da semana é atribuída quando o participante abre o ranking pela primeira vez naquela semana. Todos começam em Bronze. Entre grupos com pelo menos cinco participantes, os 20% mais bem colocados e ativos sobem uma divisão na semana seguinte. Em grupos com pelo menos dez, apenas os últimos 10% ativos podem descer uma divisão. Uma semana sem XP não causa rebaixamento; ausência por várias semanas preserva a divisão. A progressão tem teto em Master e piso em Bronze.

As pontuações da liga usam somente XP da semana UTC atual. A tabela `league_memberships` é privada por RLS; `get_league_board` devolve nomes e XP apenas de membros que ainda permitem aparecer publicamente. Futuramente, um job semanal poderá materializar as tabelas para grupos maiores; as consultas atuais usam os índices do ledger de XP e da membresia.
