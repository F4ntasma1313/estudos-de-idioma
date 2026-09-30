import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { loadTracks } from "@/features/Lessons/Controller";
import { Lessons } from "@/features/Lessons";
import { cefrLevels } from "@/features/Vocabulary/Model";

export default async function LessonsPage({ searchParams }: { searchParams: Promise<{ level?: string }> }) {
  const client = await createClient();
  const { data: { user } } = await client.auth.getUser();
  if (!user) redirect("/auth");
  const { data: profile } = await client.from("profiles").select("cefr_level").eq("user_id", user.id).single();
  const requested = (await searchParams).level;
  const selectedLevel = cefrLevels.find((level) => level === requested) ?? profile?.cefr_level ?? "A1";
  return <Lessons {...await loadTracks(user.id, selectedLevel)} />;
}
