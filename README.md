# English Journey

PWA responsivo para estudar inglês com Supabase Auth, vocabulário, revisão espaçada, lições, XP, metas, conquistas, missões, progresso, estudo offline e lembretes Web Push. O código usa TypeScript estrito e MVC por contexto.

## Configuração

Requer Node.js 20.9+ e um projeto Supabase. Execute `npm install`, copie `.env.example` para `.env.local` e preencha `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`. A URL do projeto já consta no exemplo. A chave pública pode ser exposta no navegador; **nunca publique** `SUPABASE_SERVICE_ROLE_KEY` nem `VAPID_PRIVATE_KEY`.

No SQL Editor do Supabase, execute as migrations nesta ordem, cada uma uma única vez:

1. `supabase/migrations/202609290001_foundation.sql`
2. `supabase/migrations/202609290002_learning_core.sql`
3. `supabase/migrations/202609290003_starter_content.sql`
4. `supabase/migrations/202609290004_reading_writing.sql`
5. `supabase/migrations/202609290005_rankings_leagues.sql`

Em projetos onde as primeiras já foram aplicadas, execute somente as pendentes. O conteúdo inicial tem 52 palavras revisadas, três trilhas, seis textos de leitura e seis desafios de escrita.

### Catálogo de 20.000 palavras

O arquivo `data/english-vocabulary-20000.csv` foi preparado da planilha recebida do usuário. Para carregá-lo pelo Supabase SQL Editor, execute nesta ordem:

1. `supabase/manual/202609300001_vocabulary_categories.sql` (nove categorias; pode ser reexecutado).
2. `supabase/manual/vocabulary-catalog/catalog-01.sql` até `catalog-06.sql`, em ordem (2.000 palavras por lote). Se esses lotes bilíngues já terminaram sem erro, não é preciso repeti-los.
3. Para cada número de `07` a `10`, execute `catalog-NN.sql`, `catalog-NNb.sql`, `catalog-NNc.sql` e `catalog-NNd.sql`, nessa ordem. Cada parte contém 500 palavras e cabe no SQL Editor. Se `catalog-07.sql` exibiu “Query is too large”, comece pelo novo `catalog-07.sql` e siga até `catalog-10d.sql`.
4. Se você tinha importado uma versão anterior sem português, repita os lotes necessários: o `ON CONFLICT` preenche `definition_pt` e `example_pt` nos registros existentes.
5. `supabase/manual/vocabulary-catalog/starter-bilingual.sql` (quatro palavras do conteúdo inicial ausentes da planilha).
6. `supabase/manual/202609300002_vocabulary_activities.sql` (seis trilhas A1–C2, blocos e atividades de até 25 palavras; não precisa reexecutar se já foi aplicado).

O último script mostra a quantidade de atividades e palavras por nível. A soma de `palavras` deve ser pelo menos 20.000, pois o conteúdo inicial pode conter palavras adicionais. As 5.038 entradas sem `frequency_rank` ficam com `NULL` no banco. As entradas `play` e `volley` receberam as correções descritas em `public/vocabulary-attribution.txt`.

A planilha informa que parte do conteúdo foi gerada por IA e não recebeu revisão humana individual; as classificações CEFR podem ser estimativas. As definições e frases em português do catálogo foram traduzidas automaticamente, com revisão apenas por amostragem. As fontes declaradas na planilha e as alterações feitas estão em `public/vocabulary-attribution.txt`. O importador CSV/JSON também aceita frequência vazia e não inventa dados ausentes.

No Supabase Auth, adicione `http://localhost:3000/auth/callback` e `https://estudos-de-idioma.vercel.app/auth/callback` aos redirects. Configure a Site URL de produção e, se desejar, habilite Google OAuth no painel. O cadastro por e-mail pode exigir confirmação, conforme as opções do projeto.

Depois, rode `npm run dev` e abra `http://localhost:3000`.

## Deploy na Vercel

Configure `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` e `NEXT_PUBLIC_SITE_URL=https://estudos-de-idioma.vercel.app` nas variáveis de ambiente da Vercel. Aplique as migrations **antes** de publicar a versão que usa vocabulário e lições. O app está em [estudos-de-idioma.vercel.app](https://estudos-de-idioma.vercel.app/).

Web Push é opcional. Gere um par VAPID (`npx web-push generate-vapid-keys`), coloque `NEXT_PUBLIC_VAPID_PUBLIC_KEY` na Vercel e configure os secrets `NEXT_PUBLIC_VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT` (por exemplo `mailto:admin@example.com`) e `SUPABASE_SERVICE_ROLE_KEY` no GitHub Actions. O job `.github/workflows/push-reminders.yml` verifica lembretes a cada 30 minutos. Sem esses secrets, o job ignora envios; o restante do app funciona.

## Comandos

```bash
npm run dev
npm run typecheck
npm run lint
npm test
npm run build
npm run seed:vocabulary -- --file data/vocabulary-starter.csv
npm run seed:vocabulary -- --file data/vocabulary-starter.csv --apply
npm run seed:vocabulary -- --file data/english-vocabulary-20000.csv
```

O preview do importador não grava dados. `--apply` requer `SUPABASE_SERVICE_ROLE_KEY` em `.env.local` e deve rodar somente em um ambiente confiável. `seed:categories` e `seed:lessons` gravam diretamente e também exigem essa chave. Dados de usuário e prêmios são protegidos por RLS e funções SQL; o navegador usa apenas a chave pública.

## Arquitetura

- `src/app`: entradas Next.js e rotas REST.
- `src/features/<Contexto>/{Model,Controller,View}`: interface e regras de cada contexto.
- `src/repositories`: consultas e comandos Supabase.
- `src/services`: integração de vocabulário, offline e push.
- `supabase/migrations`: schema e conteúdo inicial.
- `docs/`: decisões de [arquitetura](docs/architecture.md), [banco](docs/database.md), [gamificação](docs/gamification.md), [revisão](docs/spaced-repetition.md), [ranking](docs/ranking.md) e [push](docs/push-notifications.md).

## Estado atual

O fluxo principal de estudo, revisão e lições está implementado. A prática inclui escolha múltipla, digitação, escuta com síntese de voz, flashcards livres e repetição de frases com reconhecimento de fala quando o navegador suporta Web Speech. A correspondência da fala é uma estimativa de texto, sem avaliação fonética. O modo offline usa IndexedDB, guarda respostas com um ID de operação e sincroniza ao voltar a conexão; abra o app online ao menos uma vez para instalar o cache. A instalação PWA exige HTTPS ou localhost.

O catálogo de 20.000 palavras e suas atividades por nível estão preparados para execução no Supabase SQL Editor. O escopo ampliado ainda exige conteúdo de listening com áudio próprio, nivelamento e administração. Reading tem textos e questões corrigidas pelo banco; writing registra textos privados, sem avaliação automática nesta versão. Ranking e ligas exigem participação pública opt-in. O envio de Web Push depende das chaves VAPID e dos secrets do job.
