import type { DatabaseClient } from "../Model";
import type { ReadingPassage, ReadingQuestion } from "@/features/Reading/Model";
import type { WritingChallenge, WritingSubmission } from "@/features/Writing/Model";

export async function listReading(client: DatabaseClient): Promise<ReadingPassage[]> {
  const { data, error } = await client.from("reading_passages").select("id,title,body_en,cefr_level").eq("published", true).order("cefr_level");
  if (error) throw error;
  return (data ?? []).map((item) => ({ id: item.id, title: item.title, bodyEn: item.body_en, cefrLevel: item.cefr_level }));
}

export async function getReading(client: DatabaseClient, id: string): Promise<ReadingPassage | null> {
  const { data, error } = await client.from("reading_passages").select("id,title,body_en,cefr_level").eq("id", id).eq("published", true).maybeSingle();
  if (error) throw error;
  return data ? { id: data.id, title: data.title, bodyEn: data.body_en, cefrLevel: data.cefr_level } : null;
}

export async function getReadingQuestions(client: DatabaseClient, id: string): Promise<ReadingQuestion[]> {
  const { data, error } = await client.rpc("get_reading_questions", { p_passage_id: id });
  if (error) throw error;
  return (data ?? []) as ReadingQuestion[];
}

export async function submitReading(client: DatabaseClient, questionId: string, optionIndex: number) {
  const { data, error } = await client.rpc("submit_reading_answer", { p_question_id: questionId, p_option_index: optionIndex });
  if (error) throw error;
  return data;
}

export async function listWriting(client: DatabaseClient): Promise<WritingChallenge[]> {
  const { data, error } = await client.from("writing_challenges").select("id,title,prompt_pt,cefr_level,min_words").eq("published", true).order("cefr_level");
  if (error) throw error;
  return (data ?? []).map((item) => ({ id: item.id, title: item.title, promptPt: item.prompt_pt, cefrLevel: item.cefr_level, minWords: item.min_words }));
}

export async function getWriting(client: DatabaseClient, id: string): Promise<WritingChallenge | null> {
  const { data, error } = await client.from("writing_challenges").select("id,title,prompt_pt,cefr_level,min_words").eq("id", id).eq("published", true).maybeSingle();
  if (error) throw error;
  return data ? { id: data.id, title: data.title, promptPt: data.prompt_pt, cefrLevel: data.cefr_level, minWords: data.min_words } : null;
}

export async function getWritingSubmission(client: DatabaseClient, userId: string, challengeId: string): Promise<WritingSubmission | null> {
  const { data, error } = await client.from("writing_submissions").select("body_en,word_count,updated_at").eq("user_id", userId).eq("challenge_id", challengeId).maybeSingle();
  if (error) throw error;
  return data ? { bodyEn: data.body_en, wordCount: data.word_count, updatedAt: data.updated_at } : null;
}

export async function submitWriting(client: DatabaseClient, challengeId: string, bodyEn: string) {
  const { data, error } = await client.rpc("submit_writing", { p_challenge_id: challengeId, p_body_en: bodyEn });
  if (error) throw error;
  return data;
}
