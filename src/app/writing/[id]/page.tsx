import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getWriting, getWritingSubmission } from "@/repositories/content";
import { WritingDetail } from "@/features/Writing";

export default async function WritingDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const client = await createClient();
  const { data: { user } } = await client.auth.getUser();
  if (!user) redirect("/auth");
  const { id } = await params;
  const challenge = await getWriting(client, id);
  if (!challenge) notFound();
  const submission = await getWritingSubmission(client, user.id, id);
  return <WritingDetail challenge={challenge} submission={submission} />;
}
