import type { StudyCard } from "@/features/Vocabulary/Model";

export interface OfflineDeck { key: string; ownerId: string; cards: StudyCard[]; savedAt: number }
export interface PendingAnswer { id: string; ownerId: string; wordId: string; answer: string; operationId: string; responseTimeMs: number; lessonId?: string; queuedAt: number }
