import { createClient } from "@/lib/supabase/server";
import { getProgressData } from "@/repositories/progress";

export async function loadProgress(userId: string) { return getProgressData(await createClient(), userId); }
