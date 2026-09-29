import { z } from "zod";

export const cefrLevels = ["A1", "A2", "B1", "B2", "C1", "C2"] as const;
export const searchSchema = z.object({ q: z.string().trim().max(80).optional(), level: z.enum(cefrLevels).optional(), cursor: z.string().uuid().optional() });
export const answerSchema = z.object({ wordId: z.uuid(), answer: z.string().trim().min(1).max(200), operationId: z.uuid(), responseTimeMs: z.number().int().min(0).max(300000).optional(), lessonId: z.uuid().optional() });
export interface VocabularyWord { id: string; word: string; translation: string; definition_en: string; example_en: string; cefr_level: string; word_type: string; phonetic: string | null; }
export interface StudyCard { id: string; word: string; phonetic: string | null; cefrLevel: string; options: string[]; }
export interface AnswerResult { correct: boolean; translation: string; awardedXp: number; missionXp?: number; coinsAwarded?: number; totalXp: number; level: number; mastery: number; nextReviewAt: string; duplicate: boolean; }
export interface VocabularyViewProps { initialLevel: string }
