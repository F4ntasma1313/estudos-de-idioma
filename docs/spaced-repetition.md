# Learning Engine e revisão espaçada

`LearningEngine` recebe fatos do banco: dificuldade da palavra, acertos/erros, tempo de resposta, última revisão, intervalo e facilidade. Ele devolve `mastery_score` de 0 a 100 e `next_review_at`; a persistência ocorre em transação com a tentativa. Não confia em pontuação calculada no navegador.

Resposta `Errei` reduz domínio e reinicia intervalo em minutos; `Difícil` repete em prazo curto; `Bom` multiplica intervalo pela facilidade; `Fácil` amplia mais. Facilidade fica em faixa limitada, e o intervalo máximo é limitado. Lapsos recorrentes reduzem facilidade. Um fator de esquecimento por dias em atraso reduz o domínio exibido, sem destruir o histórico de acertos. A seleção diária prioriza atrasadas, depois fracas, e mistura palavras novas sob limite da meta. Empates usam ID para seleção determinística. Testes devem cobrir primeira revisão, erro, acerto, atraso, limite de intervalo e timezone.
