import type { ActivityDefinition } from "../index";

export const communicationActivities: readonly ActivityDefinition[] = [
  { id: 11, slug: "resposta-conversa", title: "Escolher a resposta de uma conversa", category: "Conversação", icon: "💬", summary: "Encontre a resposta que combina com a situação.", interests: ["Conversação", "Viagens"], steps: [
    { kind: "choice", context: "Would you like some coffee?", prompt: "Qual resposta é natural se você aceita a oferta?", options: ["Yes, please.", "I went yesterday.", "It's on the table.", "Because I can."], answer: "Yes, please.", explanation: "A pergunta oferece café; Yes, please aceita educadamente." },
  ] },
  { id: 12, slug: "situacao-real", title: "Simular uma situação real", category: "Conversação", icon: "🧳", summary: "Resolva um objetivo de viagem usando inglês.", interests: ["Viagens", "Conversação"], steps: [
    { kind: "choice", context: "Você chegou ao hotel, mas sua reserva não aparece.", prompt: "O que você diz primeiro ao atendente?", options: ["Could you check my booking, please?", "I am a blue suitcase.", "The weather was yesterday.", "No, I don't like trains."], answer: "Could you check my booking, please?", explanation: "Uma pergunta educada ajuda a localizar a reserva." },
    { kind: "write", prompt: "O atendente pede seu nome e a data. Escreva uma resposta breve em inglês.", modelAnswer: "My name is Ana Silva. I booked a room for Friday, June 12.", hint: "Inclua nome, data e uma frase educada." },
  ] },
  { id: 13, slug: "pedir-esclarecimento", title: "Pedir esclarecimentos", category: "Conversação", icon: "❔", summary: "Faça a pergunta que falta para entender um combinado.", interests: ["Viagens", "Trabalho", "Conversação"], steps: [
    { kind: "write", context: "Let's meet at the station.", prompt: "Pergunte em inglês qual estação e a que horas.", modelAnswer: "Which station should we meet at, and what time?", hint: "Comece com Which station... e What time..." },
  ] },
  { id: 14, slug: "descrever-imagem", title: "Descrever uma imagem", category: "Conversação", icon: "🖼️", summary: "Descreva quem aparece, o que faz e onde está.", interests: ["Conversação", "Estudos"], steps: [
    { kind: "write", prompt: "Observe a imagem e escreva três informações em inglês: quem, ação e lugar.", modelAnswer: "A woman is cooking soup in her kitchen. She looks busy. The meal may be for her family.", hint: "A1: use She is...; B1+: acrescente uma hipótese." },
  ] },
  { id: 15, slug: "comparar-imagens", title: "Comparar duas imagens", category: "Conversação", icon: "↔️", summary: "Descreva diferenças entre duas cenas.", interests: ["Conversação", "Estudos"], steps: [
    { kind: "write", prompt: "Compare as duas imagens e escreva pelo menos duas diferenças em inglês.", modelAnswer: "In the first picture, the door is open and the sun is shining. In the second, the door is closed and it is raining.", hint: "Use In the first picture... e In the second picture..." },
  ] },
  { id: 16, slug: "palavra-definicao", title: "Descobrir uma palavra pela definição", category: "Vocabulário", icon: "📖", summary: "Use uma definição em inglês para recuperar a palavra.", interests: ["Estudos", "Trabalho"], steps: [
    { kind: "text", context: "A person who repairs cars.", prompt: "Qual é a palavra em inglês?", answer: "mechanic", explanation: "Mechanic é a pessoa que conserta carros.", hint: "Começa com m." },
  ] },
  { id: 17, slug: "explicar-sem-palavra", title: "Explicar sem usar a palavra", category: "Vocabulário", icon: "🚫", summary: "Descreva um objeto sem dizer seu nome.", interests: ["Conversação", "Estudos"], steps: [
    { kind: "write", context: "Palavra secreta: umbrella. Não escreva umbrella; em B1 ou acima, evite também rain.", prompt: "Explique em inglês para que serve o objeto.", blockedWords: ["rain"], modelAnswer: "You carry it outside when the weather is wet. It keeps your head dry.", hint: "Use You use it when..." },
  ] },
  { id: 18, slug: "combinacoes-naturais", title: "Associar combinações naturais", category: "Vocabulário", icon: "🔗", summary: "Complete expressões comuns em inglês.", interests: ["Estudos", "Trabalho", "Programação"], steps: [
    { kind: "choice", context: "___ a decision", prompt: "Qual verbo combina naturalmente com decision?", options: ["make", "do", "take", "put"], answer: "make", explanation: "A combinação comum é make a decision." },
    { kind: "choice", context: "___ rain", prompt: "Qual adjetivo combina naturalmente com rain?", options: ["heavy", "strong", "big", "hard"], answer: "heavy", explanation: "Dizemos heavy rain." },
  ] },
  { id: 19, slug: "significado-contexto", title: "Escolher o significado pelo contexto", category: "Vocabulário", icon: "🏦", summary: "A mesma palavra pode ter sentidos diferentes.", interests: ["Estudos", "Viagens"], steps: [
    { kind: "choice", context: "We sat on the river bank.", prompt: "O que bank significa nessa frase?", options: ["margem do rio", "instituição financeira", "balcão", "banco de dados"], answer: "margem do rio", explanation: "River define o contexto: é a margem do rio." },
    { kind: "choice", context: "The bank closes at five.", prompt: "E nesta frase?", options: ["instituição financeira", "margem do rio", "montanha", "cadeira"], answer: "instituição financeira", explanation: "Closes at five indica o horário de uma instituição." },
  ] },
  { id: 20, slug: "falsos-cognatos", title: "Resolver falsos cognatos", category: "Vocabulário", icon: "⚠️", summary: "Evite traduções parecidas que mudam o sentido.", interests: ["Estudos", "Conversação"], steps: [
    { kind: "choice", context: "I actually live in Brazil.", prompt: "Actually significa o quê nessa frase?", options: ["na verdade", "atualmente", "acidentalmente", "ativamente"], answer: "na verdade", explanation: "Actually = na verdade; currently = atualmente." },
    { kind: "write", prompt: "Escreva uma frase curta com currently para dizer onde você mora atualmente.", modelAnswer: "I currently live in Brazil.", hint: "Currently indica tempo presente." },
  ] },
];
