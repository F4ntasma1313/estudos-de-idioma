# Web Push

Contrato futuro: `POST /api/v1/push/subscribe` valida subscription com Zod e associa `auth.uid()`; `DELETE` remove apenas a própria inscrição. Armazenar endpoint de forma restrita, chaves criptografadas em repouso quando a infraestrutura permitir, e nunca registrar tokens em logs. `NEXT_PUBLIC_VAPID_PUBLIC_KEY` pode ir ao cliente; `VAPID_PRIVATE_KEY` e `VAPID_SUBJECT` ficam somente no job/servidor.

O agendador calcula horário local pela timezone IANA, respeita opt-in por categoria e quiet hours, grava notificação interna e envia push com deduplicação por `(user_id,type,local_date)`. Erros 404/410 removem subscription; erros transitórios são repetidos com backoff. O service worker aceita apenas URLs internas predefinidas. Solicitar permissão só após ação do usuário.
