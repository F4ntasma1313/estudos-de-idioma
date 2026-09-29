import type { DatabaseClient } from "../Model";
import type { VocabularyWord } from "@/features/Vocabulary/Model";

const fields = "id,word,translation,definition_en,example_en,cefr_level,word_type,phonetic";

export async function findWords(client: DatabaseClient, options: { q?: string; level?: string; cursor?: string; limit?: number }): Promise<VocabularyWord[]> {
  let query = client.from("vocabulary_words").select(fields).order("id").limit(options.limit ?? 20);
  if (options.level) query = query.eq("cefr_level", options.level);
  if (options.q) query = query.or(`word.ilike.%${escapeSearch(options.q)}%,translation.ilike.%${escapeSearch(options.q)}%`);
  if (options.cursor) query = query.gt("id", options.cursor);
  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []) as VocabularyWord[];
}

export async function findStudyWords(client: DatabaseClient, userId: string, level: string, reviewOnly = false): Promise<VocabularyWord[]> {
  if (!userId) throw new Error("Usuário obrigatório.");
  const { data, error } = await client.rpc("select_study_words", { p_level: level, p_review_only: reviewOnly });
  if (error) throw error;
  return (data ?? []) as VocabularyWord[];
}

export async function submitWordAnswer(client: DatabaseClient, payload: { wordId: string; answer: string; operationId: string; responseTimeMs?: number; lessonId?: string }) {
  const { data, error } = await client.rpc("submit_vocabulary_answer", { p_word_id: payload.wordId, p_answer: payload.answer, p_operation_id: payload.operationId, p_response_time_ms: payload.responseTimeMs ?? null, p_lesson_id: payload.lessonId ?? null });
  if (error) throw error;
  return data;
}

function escapeSearch(value: string): string { return value.replace(/[(),.%]/g, "").trim(); }
