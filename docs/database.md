# Banco e relacionamentos

`supabase/migrations/` contém o schema executável em quatro etapas: fundação, núcleo de aprendizagem, conteúdo inicial e reading/writing. Tipos de catálogo usam `text` com `CHECK`; IDs são UUID e horários `timestamptz`. FKs de dados privados referenciam `auth.users`. Exclusão de conta faz cascade em registros privados; eventos financeiros podem exigir política de retenção antes de produção.

Índices principais: `(cefr_level,frequency_rank,id)` e busca trigram em `vocabulary_words`; `(user_id,next_review_at)` em revisões; `(module_id,position)` e `(lesson_id,position)` em currículo; `(user_id,created_at desc)` em ledgers/notificações/tentativas; unicidade de `(user_id,source_type,source_id)` quando prêmio só pode ser concedido uma vez. Cursor é ordenado por coluna indexada e ID.

RLS: catálogos permitem `SELECT` a autenticados; a aplicação filtra trilhas e lições publicadas. Cada tabela privada permite apenas acesso à própria linha quando apropriado. Ledgers e campos calculados não aceitam gravação direta do cliente. Escritas de sistema usam funções `SECURITY DEFINER` com `search_path` fixo, verificação explícita de usuário e entrada, ou backend confiável.

## Schema planejado por domínio

| Entidade | Chave e campos essenciais | Relação e regra |
| --- | --- | --- |
| `profiles` | `user_id` PK, nome, avatar, CEFR, motivo, onboarding | 1:1 `auth.users` |
| `user_settings` | `user_id` PK, timezone, tema, privacidade, notificações | 1:1 usuário |
| `vocabulary_categories` | `id` PK, slug único, nome | catálogo |
| `vocabulary_words` | `id` PK, `word`/idioma únicos, tradução, definições, exemplos, tipo, CEFR, frequência, mídia, `category_id` | N:1 categoria |
| `user_vocabulary` | PK (`user_id`,`word_id`), status, acertos, erros, domínio, facilidade, intervalo, `next_review_at` | N:N usuário/palavra |
| `tracks` | `id` PK, slug, título, CEFR, publicação | catálogo |
| `modules` | `id` PK, `track_id`, posição, requisitos | N:1 trilha |
| `lessons` | `id` PK, `module_id`, posição, XP, publicação | N:1 módulo |
| `lesson_exercises` | `id` PK, `lesson_id`, tipo, payload e gabarito separado | N:1 lição; gabarito nunca retorna ao cliente |
| `exercise_attempts` | `id` PK, usuário, exercício, resposta, resultado, duração, operação única | N:1 exercício |
| `user_lesson_progress` | PK (`user_id`,`lesson_id`), score, estado, conclusão | N:N usuário/lição |
| `daily_goals` | `user_id` PK, minutos/dia | 1:1 usuário |
| `user_daily_progress` | PK (`user_id`,`local_date`), minutos, XP, exercícios | N:1 usuário |
| `streaks` | `user_id` PK, dias atuais/máximos, último dia, freezes | 1:1 usuário |
| `achievements` / `user_achievements` | catálogo por ID; vínculo (`user_id`,`achievement_id`) único | N:N |
| `missions` / `user_missions` | catálogo por ID e janela; progresso por usuário/missão | N:N |
| `xp_transactions` / `coin_transactions` | `id` PK, usuário, valor, fonte, ID fonte, data, operação única | ledgers append-only |
| `user_levels` | `user_id` PK, nível, XP total projetado | derivado do ledger |
| `leagues` / `league_memberships` | catálogo por ID; usuário, liga, semana e pontos | inscrição por semana |
| `notifications` | `id` PK, usuário, tipo, título, mensagem, `read_at` | privada |
| `push_subscriptions` | `id` PK, usuário, endpoint único, `p256dh`, `auth`, dispositivo | privada, escrita via API |
| `study_sessions` | `id` PK, usuário, início, fim, duração, origem | privada |
| `reading_contents` / `listening_contents` | `id` PK, nível, conteúdo, perguntas, mídia | catálogos publicados |
| `writing_challenges` / `writing_submissions` | desafio por ID; envio por usuário/desafio, texto, data | catálogo + dado privado |
| `offline_sync_queue` | `client_operation_id` PK, usuário, tipo, payload, estado, tentativas | IndexedDB local; confirmação no servidor por operação única |

## RLS por classe

- **Privadas editáveis:** perfil, configurações e meta: `SELECT/UPDATE` quando `user_id = auth.uid()`; campos derivados sensíveis ficam fora dessas tabelas.
- **Privadas somente leitura no cliente:** tentativas, progresso, sessões confirmadas, ledgers, streak, missões, conquistas e notificações. Serviços de servidor/funções autenticadas validam comandos e gravam os eventos.
- **Catálogos:** `SELECT` para autenticados quando publicados; `INSERT/UPDATE/DELETE` somente via papel administrativo validado no servidor.
- **Ranking:** visão agregada com participação explícita em `user_settings.ranking_public`; nunca expor endereço de e-mail.

As tabelas de ligas e do modo listening com áudio próprio seguem planejadas; reading e writing têm schema na migration 004. Cada migration futura deve adicionar suas FKs, `CHECK`, `UNIQUE`, índices e políticas antes de expor a rota.
