import { z } from "zod";
export interface WritingChallenge { id: string; title: string; promptPt: string; cefrLevel: string; minWords: number }
export interface WritingSubmission { bodyEn: string; wordCount: number; updatedAt: string }
export interface WritingListProps { challenges: WritingChallenge[] }
export interface WritingDetailProps { challenge: WritingChallenge; submission: WritingSubmission | null }
export const writingSubmissionSchema = z.object({ challengeId: z.uuid(), bodyEn: z.string().trim().min(30).max(5000) });
