import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { loadTracks } from "@/features/Lessons/Controller";
import { Lessons } from "@/features/Lessons";

export default async function LessonsPage() {
  const client = await createClient();
  const { data: { user } } = await client.auth.getUser();
  if (!user) redirect("/auth");
  return <Lessons tracks={await loadTracks(user.id)} />;
}
