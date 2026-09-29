import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { listWriting } from "@/repositories/content";
import { WritingList } from "@/features/Writing";

export default async function WritingPage() {
  const client = await createClient();
  const { data: { user } } = await client.auth.getUser();
  if (!user) redirect("/auth");
  return <WritingList challenges={await listWriting(client)} />;
}
