export interface DayProgress { local_date: string; activity_seconds: number; answers: number; correct_answers: number; xp_earned: number }
export interface Achievement { id: string; title: string; description: string; rarity: string; earned_at: string }
export interface ProgressData { totalXp: number; level: number; streakDays: number; learnedWords: number; masteredWords: number; totalAnswers: number; correctAnswers: number; days: DayProgress[]; achievements: Achievement[] }
export interface ProgressViewProps { data: ProgressData }
