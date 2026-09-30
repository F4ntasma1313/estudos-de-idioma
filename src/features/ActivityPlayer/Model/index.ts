export type { ActivityPlayerProps, ActivityStep } from "@/features/Activities/Model";

export interface StepFeedback {
  correct: boolean;
  message: string;
}

export interface SceneProps { activityId: number; stepIndex: number; solved: boolean }

export const audioRates = [0.65, 0.85, 1, 1.2] as const

export type AudioRate = (typeof audioRates)[number]
