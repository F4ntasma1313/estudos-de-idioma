import type { ActivityDefinition } from "@/features/Activities/Model";

export interface DashboardData {
  userId: string; name: string; cefrLevel: string; learningReason: string | null; timezone: string; targetMinutes: number; startedAt: string;
  totalXp: number; level: number; streakDays: number; learnedWords: number;
  dueWords: number; todaySeconds: number; todayAnswers: number;
}
export interface DashboardViewProps { data: DashboardData; daily: ActivityDefinition; goalPercent: number }
