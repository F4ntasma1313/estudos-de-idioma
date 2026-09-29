# English Journey

Plataforma de aprendizado de inglês. A **Fase 1** entrega a fundação: Next.js, arquitetura MVC por feature, Supabase Auth, migration inicial, onboarding, dashboard e design system. Vocabulário, revisão, gamificação, PWA offline e Web Push estão especificados em `docs/` e entram nas próximas fases; o dashboard identifica esse estado para não apresentar dados fictícios.

## Requisitos

- Node.js 20.9 ou superior e npm
- Projeto Supabase com acesso ao SQL Editor

## Instalação

1. `npm install`
2. Copie `.env.example` para `.env.local` e preencha `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` com a chave pública do projeto.
3. No SQL Editor do Supabase, execute `supabase/migrations/202609290001_foundation.sql` **uma vez** em um projeto novo. Para ambientes versionados, use o Supabase CLI e a pasta `supabase/migrations/`.
4. Em Authentication → URL Configuration, defina Site URL `http://localhost:3000` e adicione `http://localhost:3000/auth/callback` e `http://localhost:3000/auth/callback?next=/auth/update-password` aos redirects permitidos.
5. Para Google OAuth, habilite o provider no Supabase e configure as credenciais do Google conforme o painel do Supabase.
6. `npm run dev` e acesse `http://localhost:3000`.

O signup por e-mail pode exigir confirmação, de acordo com a configuração do Supabase. Após entrar, o usuário realiza onboarding e vê seu painel. O projeto não usa `service_role` no cliente.

## Comandos

```bash
npm run dev
npm run typecheck
npm run lint
npm test
npm run build
```

## Arquitetura e banco

Entradas Next.js em `src/app`; features em `src/features/<Contexto>/{Model,Controller,View}`; integração Supabase em `src/lib/supabase`; acesso a dados em `src/repositories`; migration em `supabase/migrations`. A migration cria `profiles`, `user_settings`, `daily_goals` e `study_sessions`, com RLS. O trigger de `auth.users` cria os registros padrão. A função `complete_onboarding` confirma meta, fuso e nível na mesma transação.

Veja [arquitetura](docs/architecture.md), [banco](docs/database.md), [gamificação](docs/gamification.md), [revisão espaçada](docs/spaced-repetition.md) e [push](docs/push-notifications.md).

## Deploy e próximos módulos

Configure as mesmas variáveis no host Next.js, aplique migrations antes do deploy e ajuste Site URL/redirects do Supabase para o domínio HTTPS. OAuth exige configuração do provider. PWA e Web Push ainda não estão ativos; a arquitetura, variáveis e regras de segurança estão documentadas para as fases 7 e 8. Antes de produção, configurar rate limiting distribuído, CSP, observabilidade e testes E2E em um ambiente Supabase de staging.
