import { activities, activityLevels, type ActivityBand, type ActivityDefinition, type ActivityLevel, type ActivityProfile } from "../Model";
import type { ActivityStep } from "../Model";
import type { StudyCard } from "@/features/Vocabulary/Model";

export function levelBand(level: ActivityLevel): ActivityBand {
  const position = activityLevels.indexOf(level);
  return position < 2 ? "basic" : position < 4 ? "intermediate" : "advanced";
}

export function localActivityDate(timezone: string, now = new Date()): string {
  try {
    return new Intl.DateTimeFormat("en-CA", { timeZone: timezone, year: "numeric", month: "2-digit", day: "2-digit" }).format(now);
  } catch {
    return new Intl.DateTimeFormat("en-CA", { timeZone: "UTC", year: "numeric", month: "2-digit", day: "2-digit" }).format(now);
  }
}

function hash(value: string): number {
  let result = 2166136261;
  for (const char of value) result = Math.imul(result ^ char.charCodeAt(0), 16777619);
  return result >>> 0;
}

export function dailyActivity(profile: ActivityProfile, date: string): ActivityDefinition {
  const reason = profile.learningReason ?? "Outro";
  const candidates = profile.dueWords > 0 ? activities : activities.filter((activity) => activity.id !== 1);
  const pool = candidates.flatMap((activity) => {
    const weight = 1 + (activity.interests.includes(reason) ? 2 : 0) + (profile.dueWords > 0 && activity.id === 1 ? 2 : 0);
    return Array.from({ length: weight }, () => activity);
  });
  const selected = pool[hash(`${profile.userId}:${date}:${profile.level}:${reason}`) % pool.length];
  const yesterday = new Date(`${date}T12:00:00Z`);
  yesterday.setUTCDate(yesterday.getUTCDate() - 1);
  const previous = pool[hash(`${profile.userId}:${yesterday.toISOString().slice(0, 10)}:${profile.level}:${reason}`) % pool.length];
  if (selected.id !== previous.id) return selected;
  const nextIndex = (candidates.findIndex((activity) => activity.id === selected.id) + 1) % candidates.length;
  return candidates[nextIndex];
}

export function findActivity(slug: string): ActivityDefinition | undefined {
  return activities.find((activity) => activity.slug === slug);
}

export function activitySteps(activity: ActivityDefinition, level: ActivityLevel, cards: StudyCard[] = [], previousMistake?: number | null): ActivityStep[] {
  const steps: ActivityStep[] = [...activity.steps];
  const band = levelBand(level);
  if (activity.id === 2 && band === "intermediate") {
    steps[0] = { kind: "choice", context: "I couldn't see the road because the fog was ___.", prompt: "Qual palavra completa a frase?", options: ["thin", "thick", "quiet", "warm"], answer: "thick", explanation: "Thick fog é neblina densa, que impede a visão." };
  }
  if (activity.id === 2 && band === "advanced") {
    steps[0] = { kind: "choice", context: "The policy was revised because its wording was so ___ that different departments interpreted it differently.", prompt: "Qual palavra completa a frase com precisão?", options: ["precise", "ambiguous", "explicit", "concise"], answer: "ambiguous", explanation: "Ambiguous wording permite interpretações diferentes." };
  }
  const matching = cards.find((card) => card.cefrLevel === level && card.word.length > 2 && !!card.definitionEn);
  if (matching && activity.id === 16) {
    steps[0] = { kind: "text", context: matching.definitionEn ?? "", prompt: "Qual palavra do seu nível corresponde à definição?", answer: matching.word, hint: `Começa com ${matching.word[0].toUpperCase()}.`, explanation: matching.definitionPt ?? matching.translation };
  }
  if (matching && activity.id === 17) {
    const escaped = matching.word.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const extraWord = matching.definitionEn?.toLowerCase().match(/\b[a-z]{5,}\b/g)?.find((word) => !["which", "where", "there", "their", "these", "those", "something", "someone"].includes(word) && word !== matching.word.toLowerCase());
    const modelAnswer = (matching.definitionEn ?? "").replace(new RegExp(escaped, "ig"), "it");
    steps[0] = { kind: "write", context: `Palavra secreta: ${matching.word}. Não escreva essa palavra na explicação.${extraWord ? ` Em B1+ evite também ${extraWord}.` : ""}`, prompt: "Explique em inglês o significado sem dizer a palavra secreta.", blockedWords: extraWord ? [extraWord] : [], modelAnswer: extraWord ? modelAnswer.replace(new RegExp(`\\b${extraWord}\\b`, "ig"), "something") : modelAnswer, hint: "Explique a função ou uma situação em que ela aparece." };
  }
  if (activity.id === 29 && previousMistake === 4) {
    steps[0] = { kind: "text", context: "He ___ to school every day.", prompt: "Corrija o verbo no presente simples em um contexto novo.", answer: "goes", explanation: "Com he, go vira goes." };
    steps[1] = { kind: "text", context: "My sister ___ English after work.", prompt: "Aplique a mesma regra em outra frase.", answer: "studies", explanation: "Com my sister, study vira studies." };
  }
  if (activity.id === 29 && previousMistake === 21) {
    steps[0] = { kind: "text", context: "This task is easier than that one. That task is ___ than this one.", prompt: "Refaça a comparação em novo contexto.", answer: "harder", explanation: "A outra tarefa é mais difícil." };
    steps[1] = { kind: "text", context: "My room is bigger than yours. Your room is ___ than mine.", prompt: "Transforme a comparação de novo.", answer: "smaller", explanation: "Se um quarto é maior, o outro é menor." };
  }
  if (activity.id === 29 && previousMistake === 22) {
    steps[0] = { kind: "text", context: "I work from home. Last year, I ___ in an office.", prompt: "Use o passado do verbo em novo contexto.", answer: "worked", explanation: "Last year pede worked." };
    steps[1] = { kind: "text", context: "She studies English. Yesterday, she ___ English.", prompt: "Aplique o passado novamente.", answer: "studied", explanation: "Yesterday pede studied." };
  }
  const last = steps[steps.length - 1];
  if (band !== "basic" && last && ["choice", "text", "order", "scene"].includes(last.kind)) {
    steps.push({ kind: "write", prompt: band === "advanced" ? "Justifique a solução em inglês e cite uma pista do contexto ou uma regra." : "Explique em uma frase em inglês por que essa resposta faz sentido.", modelAnswer: `The answer is "${last.answer}" because it fits the context.`, hint: "Use because para justificar." });
  }
  return steps;
}

export function normalizeAnswer(value: string): string {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9\s]/g, "").replace(/\s+/g, " ").trim();
}

export function completionKey(userId: string, date: string): string {
  return `ej-activities:${userId}:${date}`;
}

export function readCompletions(userId: string, date: string): string[] {
  try {
    const stored: unknown = JSON.parse(localStorage.getItem(completionKey(userId, date)) ?? "[]");
    return Array.isArray(stored) ? stored.filter((item): item is string => typeof item === "string") : [];
  } catch { return []; }
}

export function saveCompletion(userId: string, date: string, slug: string): void {
  const next = new Set(readCompletions(userId, date));
  next.add(slug);
  try { localStorage.setItem(completionKey(userId, date), JSON.stringify([...next])); } catch { /* Remote saving can still succeed. */ }
}

export function readGrammarMistake(userId: string): number | null {
  try {
    const value = Number(localStorage.getItem(`ej-grammar-mistake:${userId}`));
    return [4, 21, 22].includes(value) ? value : null;
  } catch { return null; }
}

export function saveGrammarMistake(userId: string, activityId: number): void {
  if (![4, 21, 22].includes(activityId)) return;
  try { localStorage.setItem(`ej-grammar-mistake:${userId}`, String(activityId)); } catch { /* Storage can be disabled. */ }
}
