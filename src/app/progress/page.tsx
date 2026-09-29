import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { loadProgress } from "@/features/Progress/Controller";
import { Progress } from "@/features/Progress";

export default async function ProgressPage() {
  const client = await createClient();
  const { data: { user } } = await client.auth.getUser();
  if (!user) redirect("/auth");
  return <Progress data={await loadProgress(user.id)} />;
}
