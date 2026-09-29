import { z } from "zod";
export interface ReadingPassage { id: string; title: string; bodyEn: string; cefrLevel: string }
export interface ReadingQuestion { id: string; prompt: string; options: string[]; position: number }
export interface ReadingAnswerResult { correct: boolean; awardedXp: number; explanation: string; correctIndex: number; duplicate: boolean }
export interface ReadingListProps { passages: ReadingPassage[] }
export interface ReadingDetailProps { passage: ReadingPassage; questions: ReadingQuestion[] }
export const readingAnswerSchema = z.object({ questionId: z.uuid(), optionIndex: z.number().int().min(0).max(3) });
