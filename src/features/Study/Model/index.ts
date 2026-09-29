import type { AnswerResult, StudyCard } from "@/features/Vocabulary/Model";
export type StudyMode = "study" | "review" | "lesson";
export interface StudyViewProps { mode: StudyMode; initialLevel: string; userId: string; lessonId?: string; lessonTitle?: string }
export interface DeckResponse { success: boolean; data: { cards: StudyCard[] } | null; error: { message: string } | null }
export interface AnswerResponse { success: boolean; data: AnswerResult | null; error: { message: string } | null }
export interface LessonCompletion { completed: boolean; score: number; requiredScore?: number; awardedXp: number; totalXp?: number; level?: number }
