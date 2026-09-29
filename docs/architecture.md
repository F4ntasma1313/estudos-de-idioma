# English Journey — arquitetura técnica

## Decisões e limites da fase 1

Aplicação Next.js App Router, React e TypeScript estrito. O navegador apresenta a interface; Route Handlers e Server Actions autenticados executam comandos; services aplicam regras; repositories acessam PostgreSQL via Supabase. O servidor calcula toda progressão. `@supabase/ssr` mantém sessão em cookies, com PKCE. Dados privados têm RLS mesmo quando chamados via servidor. A chave `service_role` só pode existir em processos de confiança e nunca será usada no navegador.

O projeto foi criado sem remoto Git, portanto não havia `origin/main` para atualizar. A branch de trabalho é `feature/frontend/english-journey-foundation`.

## Estrutura por contexto

```text
src/
  app/                    # Entradas finas do Next.js, Route Handlers e layout
  features/
    Auth/{Model,Controller,View}/
    Dashboard/{Model,Controller,View}/
    Onboarding/{Model,Controller,View}/
    Vocabulary/{Model,Controller,View}/
    Review/{Model,Controller,View}/
    Lessons/{Model,Controller,View}/
    Gamification/{Model,Controller,View}/
  components/             # Cada componente com lógica: {Model,Controller,View}/index
  hooks/                  # Comportamento React reutilizável
  services/               # LearningEngine, GamificationService, PushService
  repositories/           # Acesso a dados, sem regras de apresentação
  lib/supabase/           # Clientes server/browser e atualização de sessão
  config/                 # Ambiente e tokens
  utils/                  # Funções puras genéricas
supabase/migrations/       # DDL, índices, funções e RLS
public/                   # Manifest, ícones e service worker
docs/                     # Contratos e decisões
```

Para cada feature, `Model/index.ts` define tipos e schemas, `Controller/index.ts` prepara estado/comandos, `View/index.tsx` renderiza e `index.tsx` conecta. As entradas obrigatórias de Next.js ficam finas. Acesso externo ocorre em services/repositories.

## Contratos e APIs

Respostas: `{ success: true, data, error: null }` ou `{ success: false, data: null, error: { code, message } }`. Comandos usam Zod, autenticação via `auth.getUser()`, validação de origem quando cookies autorizam mutações, chave de idempotência para tentativas e limite por usuário. Eventos de estudo têm IDs de operação únicos. Rotas v1 planejadas: `/auth`, `/profile`, `/vocabulary`, `/vocabulary/review`, `/lessons`, `/exercises/answer`, `/progress`, `/goals`, `/missions`, `/ranking`, `/notifications`, `/push/subscribe`. Listas extensas usam cursor estável `(sort_key,id)` e limite máximo. Erros esperados usam `AppError`; cada request recebe ID para logs estruturados sem dados sensíveis.

## Entidades e fluxo de dados

```text
auth.users 1─1 profiles 1─1 user_settings
    │           ├─N user_vocabulary N─1 vocabulary_words N─1 vocabulary_categories
    │           ├─N user_lesson_progress N─1 lessons N─1 modules N─1 tracks
    │           │                            └─N lesson_exercises 1─N exercise_attempts
    │           ├─N study_sessions, writing_submissions, notifications, push_subscriptions
    │           ├─N xp_transactions, coin_transactions, user_achievements, user_missions
    │           ├─1 daily_goals, streaks, user_levels
    │           └─N user_daily_progress, league_memberships
achievements 1─N user_achievements; missions 1─N user_missions
leagues 1─N league_memberships; reading_contents/listening_contents/writing_challenges são catálogos
```

`auth.users` é a identidade; `profiles` contém dados públicos mínimos e preferências privadas em `user_settings`. Catálogos globais são lidos por usuários autenticados e escritos apenas por administração. `user_vocabulary` usa chave `(user_id,word_id)`. Ledger de XP/Coins é append-only; saldos são projeções transacionais. `offline_sync_queue` é armazenamento local IndexedDB; o servidor registra `client_operation_id` para deduplicação.

## Fluxo do usuário

Cadastro ou Google OAuth → confirmação de e-mail quando configurada → onboarding (nível, motivação, meta e fuso) → teste opcional → dashboard com recomendação → trilha/lição ou palavras → resposta enviada ao servidor → tentativa gravada → domínio e próxima revisão atualizados → XP/Coins/streak/missões/conquistas atualizados na mesma transação → feedback → revisão diária → estatísticas. Em offline, operações permitidas entram na fila local e sincronizam após reconexão; a resposta do servidor é a fonte de verdade.

## PWA e Push

Manifest com nome, cores, ícones 192/512 e `display: standalone`. Service worker usa cache-first somente em assets versionados; network-first em navegação pública com fallback offline; conteúdo privado não entra em Cache Storage compartilhado. Dados de estudo offline ficam em IndexedDB, segregados por usuário, com expiração e limpeza no logout. A fila contém IDs únicos, payload validado, tentativa e estado. Ao reconectar, sincroniza sequencialmente; conflito devolve estado canônico do servidor. A atualização do worker mostra aviso de nova versão antes de recarregar.

Push: navegador pede permissão após gesto explícito; `PushManager.subscribe` usa chave pública VAPID; endpoint autenticado grava endpoint e chaves, com unicidade e dono. Um job confiável seleciona usuários por horário/timezone e preferências, deduplica notificações, envia com VAPID privado e remove subscriptions expiradas. O service worker exibe a mensagem e abre rota interna permitida. Notificação interna é persistida mesmo se push não estiver disponível. A fase 1 prepara contratos/ambiente, sem alegar envio de push antes do job e credenciais existirem.

## Segurança e observabilidade

RLS por `auth.uid()` em todas as tabelas privadas; papéis admin verificados no banco ou serviço confiável. Nenhum cliente escreve XP, Coins, nível, streak ou conquistas. Filtros de usuário são reforçados por RLS. `getUser()` verifica sessão no servidor. SQL parametrizado/SDK evita interpolação; React escapa HTML; CSP e headers de segurança serão testados junto às integrações. Rate limiting distribuído precisa de armazenamento compartilhado no deploy. Logs estruturados incluem request ID e código de erro; Sentry/OpenTelemetry podem ser adicionados por adaptador.

## Dependências

Fase 1: `next`, `react`, `react-dom`, `typescript`, `tailwindcss`, `eslint`, `@supabase/supabase-js`, `@supabase/ssr`, `zod`, `lucide-react`. Próximas fases: `react-hook-form`, `@hookform/resolvers`, `@tanstack/react-query`, `motion` (ou Framer Motion), `web-push`, `idb`, `vitest`, `@playwright/test`. Instalar somente ao usar. PostgreSQL/Supabase CLI são necessários para aplicar migrations; chaves e projeto Supabase são fornecidos por ambiente.

## Fases e critérios

1. Fundação: projeto, MVC, schema e RLS iniciais, autenticação, onboarding, layout e tokens.
2. Vocabulário: importador idempotente, categorias, busca e progresso.
3. Learning Engine: domínio, algoritmo e flashcards.
4. Lições: trilhas, exercícios e desbloqueio.
5. Gamificação: ledgers, níveis, streak, missões e conquistas.
6. Dashboard: métricas, gráficos e heatmap.
7. PWA: instalação, offline e sincronização.
8. Push: subscriptions, job e preferências.
9. Práticas: listening, speaking, reading e writing.
10. Social: rankings e ligas com opt-out.
11. Admin: gestão e importação validada.
12. Qualidade: E2E, carga, acessibilidade e auditoria.

Cada fase deve manter `typecheck`, lint, testes relevantes e build verdes. Funcionalidades só são marcadas prontas quando integradas ao banco, com autorização, estados de erro/carregamento/vazio e comportamento responsivo.
