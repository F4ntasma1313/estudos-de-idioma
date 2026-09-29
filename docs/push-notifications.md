# Web Push

O usuário ativa notificações em Configurações. A permissão do navegador só é solicitada após essa ação. `POST /api/v1/push/subscribe` valida a inscrição com Zod e associa o endpoint ao usuário autenticado; `DELETE` remove apenas suas próprias inscrições. RLS protege a tabela.

O job de `.github/workflows/push-reminders.yml` roda a cada 30 minutos. Ele lê o fuso e o horário configurados, verifica se a meta do dia já foi atingida, grava uma notificação interna e tenta entregar o push. A chave `(user_id,kind,local_date)` evita lembretes duplicados no mesmo dia. Endpoints expirados (404/410) são removidos. O service worker só abre rotas internas permitidas.

Para habilitar os envios, gere o par VAPID com `npx web-push generate-vapid-keys`. Na Vercel, configure `NEXT_PUBLIC_VAPID_PUBLIC_KEY`. Nos secrets do GitHub Actions, configure `NEXT_PUBLIC_VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT` e `SUPABASE_SERVICE_ROLE_KEY`. `VAPID_SUBJECT` deve ser um URI de contato, por exemplo `mailto:admin@example.com`. A chave privada e a service role nunca vão para o navegador ou repositório.

A central em `/notifications` lista os 50 avisos mais recentes do usuário e permite marcar cada um como lido. Os links internos vindos do banco são limitados às rotas da aplicação.
