import type { DatabaseClient } from "../Model";
import type { TrackItem, ModuleItem } from "@/features/Lessons/Model";
import type { VocabularyWord } from "@/features/Vocabulary/Model";

export async function getTracks(client: DatabaseClient, userId: string): Promise<TrackItem[]> {
  const [tracks, modules, lessons, completed] = await Promise.all([
    client.from("tracks").select("id,title,description,cefr_level").eq("published", true).order("title"),
    client.from("modules").select("id,track_id,title,position").order("position"),
    client.from("lessons").select("id,module_id,title,description,position").eq("published", true).order("position"),
    client.from("user_lesson_progress").select("lesson_id").eq("user_id", userId).not("completed_at", "is", null),
  ]);
  if (tracks.error || modules.error || lessons.error || completed.error) throw new Error("Não foi possível carregar as trilhas.");
  const done = new Set((completed.data ?? []).map((item) => item.lesson_id));
  return (tracks.data ?? []).map((track) => ({
    id: track.id, title: track.title, description: track.description, cefrLevel: track.cefr_level,
    modules: (modules.data ?? []).filter((module) => module.track_id === track.id).map((module): ModuleItem => ({
      id: module.id, title: module.title, position: module.position,
      lessons: (lessons.data ?? []).filter((lesson) => lesson.module_id === module.id).map((lesson) => ({ id: lesson.id, title: lesson.title, description: lesson.description, position: lesson.position, completed: done.has(lesson.id) })),
    })),
  }));
}

export async function getLesson(client: DatabaseClient, lessonId: string) {
  const { data, error } = await client.from("lessons").select("id,title,description").eq("id", lessonId).eq("published", true).single();
  if (error || !data) return null;
  return data;
}

export async function getLessonWords(client: DatabaseClient, lessonId: string): Promise<VocabularyWord[]> {
  const { data: exercises, error } = await client.from("lesson_exercises").select("word_id").eq("lesson_id", lessonId).order("position");
  if (error) throw error;
  const ids = (exercises ?? []).map((item) => item.word_id as string);
  if (!ids.length) return [];
  const { data: words, error: wordsError } = await client.from("vocabulary_words").select("id,word,translation,definition_en,example_en,cefr_level,word_type,phonetic").in("id", ids);
  if (wordsError) throw wordsError;
  const byId = new Map((words ?? []).map((word) => [word.id, word]));
  return ids.flatMap((id) => { const word = byId.get(id); return word ? [word as VocabularyWord] : []; });
}

export async function completeLesson(client: DatabaseClient, lessonId: string) {
  const { data, error } = await client.rpc("complete_lesson", { p_lesson_id: lessonId });
  if (error) throw error;
  return data;
}
