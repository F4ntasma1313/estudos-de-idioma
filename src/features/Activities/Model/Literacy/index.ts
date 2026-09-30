import type { ActivityDefinition } from "../index";

export const literacyActivities: readonly ActivityDefinition[] = [
  { id: 21, slug: "transformar-frase", title: "Transformar frases mantendo o sentido", category: "Leitura e escrita", icon: "🔄", summary: "Mude a estrutura sem perder a comparação.", interests: ["Estudos", "Trabalho"], steps: [
    { kind: "text", context: "This exercise is easier than that one. → That exercise is ___ than this one.", prompt: "Digite a palavra que falta.", answer: "harder", explanation: "Se este é mais fácil, o outro é mais difícil: harder." },
  ] },
  { id: 22, slug: "mudar-tempo-verbal", title: "Mudar o tempo verbal com contexto", category: "Leitura e escrita", icon: "📅", summary: "Conte no passado algo que acontece no presente.", interests: ["Estudos", "Trabalho"], steps: [
    { kind: "text", context: "I work from home. Last year, I ___ from home.", prompt: "Complete com o passado de work.", answer: "worked", explanation: "Last year pede passado simples: worked." },
    { kind: "write", prompt: "Agora descreva sua rotina do ano passado em uma frase em inglês.", modelAnswer: "Last year, I worked from home and studied English at night.", hint: "Use last year e um verbo no passado." },
  ] },
  { id: 23, slug: "grau-formalidade", title: "Adaptar o grau de formalidade", category: "Leitura e escrita", icon: "👔", summary: "Peça a mesma coisa a um amigo e a um cliente.", interests: ["Trabalho", "Negócios"], steps: [
    { kind: "write", prompt: "Peça a um amigo que envie um documento. Use inglês informal.", modelAnswer: "Hey, can you send me the document when you have a minute?", hint: "Uma mensagem curta e amigável basta." },
    { kind: "write", prompt: "Faça o mesmo pedido a um cliente. Use inglês profissional.", modelAnswer: "Could you please send me the document at your earliest convenience?", hint: "Use Could you please..." },
  ] },
  { id: 24, slug: "reconstruir-historia", title: "Reconstruir uma história", category: "Leitura e escrita", icon: "📚", summary: "Ponha fatos em uma ordem coerente.", interests: ["Estudos", "Conversação"], steps: [
    { kind: "order", prompt: "Organize os acontecimentos em uma sequência lógica.", tokens: ["Finally, she arrived at work.", "First, Ana woke up late.", "Then, she missed the bus."], answer: "First, Ana woke up late. Then, she missed the bus. Finally, she arrived at work.", explanation: "First inicia; then continua; finally encerra a sequência." },
    { kind: "write", prompt: "Explique em inglês por que Ana chegou tarde.", modelAnswer: "Ana arrived late because she woke up late and missed the bus.", hint: "Use because." },
  ] },
  { id: 25, slug: "inferir-texto", title: "Inferir informações em um texto", category: "Leitura e escrita", icon: "🔍", summary: "Use pistas para concluir algo que não foi dito diretamente.", interests: ["Estudos", "Viagens"], steps: [
    { kind: "choice", context: "Ana grabbed her umbrella before leaving. Dark clouds covered the sky.", prompt: "O que Ana provavelmente espera?", options: ["Chuva", "Calor extremo", "Neve", "Uma ligação"], answer: "Chuva", explanation: "Umbrella e dark clouds sustentam a inferência de chuva." },
    { kind: "write", prompt: "Copie em inglês a pista do texto que sustenta sua resposta.", modelAnswer: "Dark clouds covered the sky.", hint: "Procure a frase sobre o céu." },
  ] },
  { id: 26, slug: "informacao-especifica", title: "Localizar informações específicas", category: "Leitura e escrita", icon: "🚆", summary: "Leia um horário e tome uma decisão concreta.", interests: ["Viagens", "Estudos"], steps: [
    { kind: "choice", context: "Train A: 8:40 a.m., £18. Train B: 8:55 a.m., £24. Train C: 9:10 a.m., £12.", prompt: "Qual trem chega antes das 9h e custa menos de £20?", options: ["Train A", "Train B", "Train C", "Nenhum"], answer: "Train A", explanation: "A chega às 8:40 e custa £18; B custa mais, C chega depois." },
  ] },
  { id: 27, slug: "resumir-texto", title: "Resumir com limite de palavras", category: "Leitura e escrita", icon: "✂️", summary: "Mantenha a ideia principal em até 30 palavras.", interests: ["Estudos", "Trabalho"], steps: [
    { kind: "write", context: "Maria missed the early bus because it rained heavily. She took a taxi, arrived ten minutes late and apologized to her manager. The meeting had not started yet.", prompt: "Resuma o texto em inglês com no máximo 30 palavras.", modelAnswer: "Heavy rain made Maria miss her bus. She took a taxi, arrived late and apologized, but the meeting had not begun.", hint: "Mantenha causa, ação e resultado; não copie tudo." },
  ] },
  { id: 28, slug: "melhorar-mensagem", title: "Escrever e melhorar uma mensagem", category: "Leitura e escrita", icon: "✉️", summary: "Escreva, revise e compare com um modelo.", interests: ["Trabalho", "Negócios"], steps: [
    { kind: "write", prompt: "Escreva um e-mail curto para remarcar uma reunião. Inclua motivo, novo horário e agradecimento.", deferModel: true, modelAnswer: "Hello, I need to reschedule our meeting because of a conflict. Would Thursday at 2 p.m. work for you? Thank you for your understanding.", hint: "Antes de revisar, confira: o motivo está claro? Há um novo horário? O pedido soa educado?" },
    { kind: "write", prompt: "Revise sua primeira mensagem. Torne o pedido mais claro e educado.", modelAnswer: "Hello, I apologize, but I need to reschedule our meeting. Would Thursday at 2 p.m. be convenient? Thank you for your understanding.", hint: "Compare a clareza e o tom com a primeira versão." },
  ] },
  { id: 29, slug: "corrigir-erros-novamente", title: "Corrigir os próprios erros em novo contexto", category: "Leitura e escrita", icon: "🛠️", summary: "Aplique uma regra depois de vê-la em outra situação.", interests: ["Estudos", "Trabalho"], steps: [
    { kind: "text", context: "She ___ like coffee.", prompt: "Complete a frase negativa com a forma correta.", answer: "doesn't", accepted: ["does not"], explanation: "Com she, use doesn't ou does not." },
    { kind: "text", context: "My brother ___ work on Sundays.", prompt: "Aplique a mesma regra em outro contexto.", answer: "doesn't", accepted: ["does not"], explanation: "My brother equivale a he; use doesn't." },
  ] },
  { id: 30, slug: "missao-integrada", title: "Missão integrada: planejar uma viagem", category: "Leitura e escrita", icon: "🗺️", summary: "Leia opções, ouça um aviso e responda por escrito e oralmente.", interests: ["Viagens", "Conversação"], steps: [
    { kind: "choice", context: "Hotel Green: £65/noite, perto da estação. Hotel Blue: £45/noite, 40 minutos da estação.", prompt: "Qual hotel é melhor se você precisa pegar um trem cedo?", options: ["Hotel Green", "Hotel Blue", "Ambos ficam na estação", "Não há informação"], answer: "Hotel Green", explanation: "A localização é decisiva para o trem cedo." },
    { kind: "choice", prompt: "Ouça o aviso e escolha o novo horário de partida.", speechText: "Attention: the train will now leave at nine thirty.", options: ["9:30", "8:30", "9:00", "10:30"], answer: "9:30", explanation: "Nine thirty = 9:30." },
    { kind: "write", prompt: "Escreva uma pergunta em inglês sobre a plataforma do trem.", modelAnswer: "Which platform does the train leave from?", hint: "Use Which platform..." },
    { kind: "record", prompt: "Explique oralmente ao companheiro a mudança de horário.", speechText: "The train now leaves at nine thirty.", modelAnswer: "The train now leaves at nine thirty, so we have more time." },
  ] },
];
