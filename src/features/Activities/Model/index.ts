import { foundationActivities } from "./Foundation";
import { communicationActivities } from "./Communication";
import { literacyActivities } from "./Literacy";
import { storyActivities } from "./Stories";
import type { StudyCard } from "@/features/Vocabulary/Model";

export const activityLevels = ["A1", "A2", "B1", "B2", "C1", "C2"] as const;
export type ActivityLevel = (typeof activityLevels)[number];
export type ActivityBand = "basic" | "intermediate" | "advanced";
export type ActivityKind = "choice" | "text" | "order" | "write" | "record" | "scene" | "route";

export interface ActivityStep {
  kind: ActivityKind;
  prompt: string;
  context?: string;
  options?: readonly string[];
  answer?: string;
  accepted?: readonly string[];
  blockedWords?: readonly string[];
  tokens?: readonly string[];
  modelAnswer?: string;
  deferModel?: boolean;
  explanation?: string;
  hint?: string;
  speechText?: string;
  scene?: string;
  href?: string;
  promptByBand?: Partial<Record<ActivityBand, string>>;
}

export interface ActivityDefinition {
  id: number;
  slug: string;
  title: string;
  category: "Vocabulário" | "Escuta e fala" | "Conversação" | "Leitura e escrita" | "Aventura";
  icon: string;
  summary: string;
  interests: readonly string[];
  steps: readonly ActivityStep[];
}

export interface ActivityProfile {
  userId: string;
  level: ActivityLevel;
  learningReason: string | null;
  timezone: string;
  dueWords: number;
}

export interface ActivitiesProps {
  profile: ActivityProfile;
  date: string;
  daily: ActivityDefinition;
}

export interface ActivityPlayerProps extends ActivitiesProps {
  activity: ActivityDefinition;
  vocabularyCards?: StudyCard[];
}

export const activities: readonly ActivityDefinition[] = [
  ...foundationActivities,
  ...communicationActivities,
  ...literacyActivities,
  ...storyActivities,
];
