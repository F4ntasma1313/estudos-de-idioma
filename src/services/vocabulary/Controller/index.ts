import { randomInt } from "node:crypto";
import type { SupabaseClient } from "@supabase/supabase-js";
import { findStudyWords, findWords } from "@/repositories/vocabulary";
import type { StudyCard, VocabularyWord } from "@/features/Vocabulary/Model";

export async function createStudyDeck(client: SupabaseClient, userId: string, level: string, reviewOnly = false): Promise<StudyCard[]> {
  const words = await findStudyWords(client, userId, level, reviewOnly);
  const pool = reviewOnly ? await findStudyWords(client, userId, level) : words;
  return createCards(words, pool);
}

export async function createLessonDeck(client: SupabaseClient, words: VocabularyWord[]): Promise<StudyCard[]> {
  if (!words.length) return [];
  const translations = new Set(words.map((word) => word.translation));
  const extra = translations.size < 4 ? await findWords(client, { level: words[0].cefr_level, limit: 100 }) : [];
  return createCards(words, [...words, ...extra]);
}

export function createCards(words: VocabularyWord[], pool: VocabularyWord[]): StudyCard[] {
  const uniqueTranslations = [...new Set(pool.map((item) => item.translation))];
  return words.map((item) => {
    const distractors = uniqueTranslations.filter((value) => value !== item.translation);
    shuffle(distractors);
    const options = [item.translation, ...distractors.slice(0, 3)];
    shuffle(options);
    return { id: item.id, word: item.word, translation: item.translation, exampleEn: item.example_en, phonetic: item.phonetic, cefrLevel: item.cefr_level, options };
  }).filter((card) => card.options.length === 4);
}

export function shuffle<T>(items: T[]): T[] {
  for (let index = items.length - 1; index > 0; index--) {
    const other = randomInt(index + 1);
    [items[index], items[other]] = [items[other], items[index]];
  }
  return items;
}

export function publicWord(word: VocabularyWord) { return { id: word.id, word: word.word, phonetic: word.phonetic, cefrLevel: word.cefr_level }; }
