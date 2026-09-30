import type { ActivityDefinition } from "../index";

export const foundationActivities: readonly ActivityDefinition[] = [
  { id: 1, slug: "revisao-espacada", title: "Revisão com repetição espaçada", category: "Vocabulário", icon: "🧠", summary: "Lembre o significado antes de revelar e revise no momento certo.", interests: ["Estudos", "Outro"], steps: [
    { kind: "route", prompt: "Abra sua fila de revisão. Tente lembrar a tradução antes de responder; o intervalo seguinte depende do acerto.", href: "/review" },
  ] },
  { id: 2, slug: "completar-frases", title: "Completar frases com contexto", category: "Vocabulário", icon: "🧩", summary: "Escolha a palavra que realmente completa a situação.", interests: ["Estudos", "Conversação"], steps: [
    { kind: "choice", context: "I'm thirsty. I need some ___.", prompt: "Qual palavra completa a frase?", options: ["water", "ticket", "pillow", "window"], answer: "water", explanation: "Thirsty indica sede; water é água.", promptByBand: { advanced: "Escolha a palavra e explique por que as outras opções não cabem no contexto." } },
  ] },
  { id: 3, slug: "montar-frase", title: "Montar uma frase", category: "Vocabulário", icon: "🧱", summary: "Organize palavras e observe a posição dos advérbios.", interests: ["Estudos", "Conversação"], steps: [
    { kind: "order", prompt: "Monte uma frase natural em inglês.", tokens: ["usually", "coffee", "morning", "drink", "I", "in", "the"], answer: "I usually drink coffee in the morning", explanation: "Usually fica antes do verbo principal drink; in the morning indica quando." },
  ] },
  { id: 4, slug: "corrigir-erro", title: "Encontrar e corrigir o erro", category: "Vocabulário", icon: "🔎", summary: "Encontre uma forma verbal incorreta e corrija a frase.", interests: ["Estudos", "Trabalho", "Programação"], steps: [
    { kind: "text", context: "She go to work every day.", prompt: "Reescreva a frase corretamente.", answer: "She goes to work every day", explanation: "Com she no presente simples, o verbo recebe -es: goes." },
  ] },
  { id: 5, slug: "ditado-progressivo", title: "Ditado progressivo", category: "Escuta e fala", icon: "🎧", summary: "Ouça, escreva e receba pistas em etapas.", interests: ["Estudos", "Conversação"], steps: [
    { kind: "text", prompt: "Ouça a frase e escreva em inglês. Se errar, ouça de novo; depois use a voz lenta e a pista.", speechText: "The train leaves at eight in the morning.", answer: "The train leaves at eight in the morning", hint: "Começa com The train e termina com in the morning.", explanation: "Leaves indica a partida do trem; at eight marca o horário." },
  ] },
  { id: 6, slug: "ouvir-instrucao", title: "Ouvir e executar uma instrução", category: "Escuta e fala", icon: "🧭", summary: "Ouça a ordem e toque no objeto correto da cena.", interests: ["Estudos", "Conversação"], steps: [
    { kind: "scene", prompt: "Ouça a instrução e escolha o objeto mencionado em inglês.", speechText: "Put the blue book under the table.", scene: "📘  🪑  📕  🖊️", options: ["📘 Blue book", "🪑 Chair", "📕 Red book", "🖊️ Pen"], answer: "📘 Blue book", explanation: "Blue book é o livro azul; under the table significa debaixo da mesa." },
    { kind: "scene", prompt: "Agora escolha em inglês onde colocar o livro azul.", speechText: "Put the blue book under the table.", options: ["Under the table", "On the table", "Behind the chair", "Inside the bag"], answer: "Under the table", explanation: "Under the table = debaixo da mesa." },
  ] },
  { id: 7, slug: "sons-semelhantes", title: "Distinguir sons semelhantes", category: "Escuta e fala", icon: "👂", summary: "Compare vogais parecidas em palavras e frases.", interests: ["Estudos", "Conversação"], steps: [
    { kind: "choice", prompt: "Ouça e escolha a palavra pronunciada.", speechText: "sheep", options: ["ship", "sheep", "shape", "shop"], answer: "sheep", explanation: "Sheep tem vogal longa; ship tem vogal curta." },
    { kind: "choice", prompt: "Agora ouça a frase e escolha a palavra que ouviu.", speechText: "The sheep is near the fence.", options: ["ship", "sheep", "shop", "shape"], answer: "sheep", explanation: "O contexto também ajuda: o animal está perto da cerca." },
  ] },
  { id: 8, slug: "shadowing", title: "Repetir acompanhando o áudio", category: "Escuta e fala", icon: "🗣️", summary: "Repita uma frase no mesmo ritmo da referência.", interests: ["Conversação", "Viagens"], steps: [
    { kind: "record", prompt: "Ouça e repita a frase em inglês. Grave outra tentativa para perceber pausas e sílabas fortes.", speechText: "Could you tell me where the station is?", modelAnswer: "Could you tell me where the station is?", hint: "Compare a pausa depois de tell me e a força em station. Priorize a clareza." },
  ] },
  { id: 9, slug: "gravar-pronuncia", title: "Gravar e comparar a pronúncia", category: "Escuta e fala", icon: "🎙️", summary: "Grave sua voz e compare com a frase de referência.", interests: ["Conversação", "Estudos"], steps: [
    { kind: "record", prompt: "Grave a frase em inglês, escute sua gravação e a referência. Tente melhorar um trecho por vez.", speechText: "I would like a glass of water, please.", modelAnswer: "I would like a glass of water, please.", hint: "Ouça a ligação entre would e like e a sílaba forte de water." },
  ] },
  { id: 10, slug: "resposta-cronometrada", title: "Responder oralmente com tempo limitado", category: "Escuta e fala", icon: "⏱️", summary: "Organize uma resposta curta e depois amplie a ideia.", interests: ["Conversação", "Trabalho"], steps: [
    { kind: "record", prompt: "Você tem 15 segundos para organizar a resposta. Depois, faça uma primeira gravação curta.", speechText: "What did you do yesterday?", modelAnswer: "I worked yesterday." },
    { kind: "record", prompt: "Agora grave uma segunda tentativa com mais detalhes: quando, onde ou com quem.", speechText: "What did you do yesterday?", modelAnswer: "I worked in the morning and watched a film with my sister at night." },
  ] },
];
