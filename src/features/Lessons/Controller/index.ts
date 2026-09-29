import { createClient } from "@/lib/supabase/server";
import { getTracks } from "@/repositories/lessons";

export async function loadTracks(userId: string) { return getTracks(await createClient(), userId); }
