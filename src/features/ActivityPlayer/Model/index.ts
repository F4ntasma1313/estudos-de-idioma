export type { ActivityPlayerProps, ActivityStep } from "@/features/Activities/Model";

export interface StepFeedback {
  correct: boolean;
  message: string;
}

export interface SceneProps { activityId: number; stepIndex: number; solved: boolean }
