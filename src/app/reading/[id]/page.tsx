import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getReading, getReadingQuestions } from "@/repositories/content";
import { ReadingDetail } from "@/features/Reading";

export default async function ReadingDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const client = await createClient();
  const { data: { user } } = await client.auth.getUser();
  if (!user) redirect("/auth");
  const { id } = await params;
  const passage = await getReading(client, id);
  if (!passage) notFound();
  return <ReadingDetail passage={passage} questions={await getReadingQuestions(client, id)} />;
}
