# Gamificação

`GamificationService` roda somente no servidor após uma tentativa validada. `awardXP` e `awardCoins` registram eventos com `source_type`, `source_id` e chave única de idempotência. `updateLevel` calcula o maior nível cujo limiar cumulativo foi atingido: `threshold(level) = round(250 * (level - 1)^1.4 + 250 * (level - 1))`, com nível 1 em 0 XP. A fórmula e o limite de nível serão versionados antes de lançar recompensas.

Repetições de uma mesma atividade têm teto de XP por dia e menor recompensa em revisões triviais. Lição concluída e conquista são premiadas uma vez. Streak avança somente quando a meta diária é atingida no fuso do usuário; freeze é consumido apenas por regra explícita. Missões e conquistas são derivadas de eventos auditáveis. Ranking usa agregados de transações confirmadas e respeita privacidade.
