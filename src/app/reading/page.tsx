import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { listReading } from "@/repositories/content";
import { ReadingList } from "@/features/Reading";

export default async function ReadingPage() {
  const client = await createClient();
  const { data: { user } } = await client.auth.getUser();
  if (!user) redirect("/auth");
  return <ReadingList passages={await listReading(client)} />;
}
