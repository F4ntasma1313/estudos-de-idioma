export interface DashboardData {
  userId: string; name: string; cefrLevel: string; targetMinutes: number; startedAt: string;
  totalXp: number; level: number; streakDays: number; learnedWords: number;
  dueWords: number; todaySeconds: number; todayAnswers: number;
}
export interface DashboardViewProps { data: DashboardData }
