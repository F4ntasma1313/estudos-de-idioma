import { z } from "zod";

export const authSchema = z.object({ email: z.email(), password: z.string().min(8, "Use pelo menos 8 caracteres.") });
export type AuthMode = "login" | "signup" | "recover";
export interface AuthViewProps { initialMode: AuthMode }
