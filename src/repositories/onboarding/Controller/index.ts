import type { OnboardingInput } from "@/features/Onboarding/Model";
import type { DatabaseClient } from "../Model";

export async function saveOnboarding(client: DatabaseClient, userId: string, data: OnboardingInput) {
  if (!userId) throw new Error("Usuário obrigatório.");
  const result = await client.rpc("complete_onboarding", { p_level: data.level, p_reason: data.reason, p_target_minutes: data.targetMinutes, p_timezone: data.timezone });
  if (result.error) throw result.error;
}
