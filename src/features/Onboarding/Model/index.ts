import { z } from "zod";

export const onboardingSchema = z.object({
  level: z.enum(["A1", "A2", "B1", "B2", "C1"]),
  reason: z.enum(["Viagens", "Trabalho", "Programação", "Negócios", "Estudos", "Conversação", "Outro"]),
  targetMinutes: z.coerce.number().int().min(5).max(240),
  timezone: z.string().min(3).max(80).refine((value) => { try { new Intl.DateTimeFormat("en-US", { timeZone: value }); return true; } catch { return false; } }, "Fuso horário inválido."),
});
export type OnboardingInput = z.infer<typeof onboardingSchema>;
export interface OnboardingViewProps { error?: string }
