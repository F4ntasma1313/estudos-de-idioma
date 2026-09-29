import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getLesson } from "@/repositories/lessons";
import { Study } from "@/features/Study";

export default async function LessonPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const client = await createClient();
  const { data: { user } } = await client.auth.getUser();
  if (!user) redirect("/auth");
  const lesson = await getLesson(client, id);
  if (!lesson) notFound();
  return <Study mode="lesson" lessonId={id} lessonTitle={lesson.title} initialLevel="A1" userId={user.id} />;
}
