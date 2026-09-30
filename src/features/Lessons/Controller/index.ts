import { createClient } from "@/lib/supabase/server";
import { getTracks } from "@/repositories/lessons";
import type { LessonsViewProps } from "../Model";

export async function loadTracks(userId: string, selectedLevel: string): Promise<LessonsViewProps> {
  const allTracks = await getTracks(await createClient(), userId);
  const tracks = allTracks.filter((track) => track.cefrLevel === selectedLevel);
  const activityCount = tracks.reduce((count, track) => count + track.modules.reduce((sum, module) => sum + module.lessons.length, 0), 0);
  return { tracks, selectedLevel, activityCount };
}
