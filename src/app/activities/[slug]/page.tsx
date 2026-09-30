import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getActivityProfile } from "@/repositories/activities";
import { dailyActivity, findActivity, localActivityDate } from "@/features/Activities/Controller";
import { ActivityPlayer } from "@/features/ActivityPlayer";
import { createStudyDeck } from "@/services/vocabulary";

export const dynamic = "force-dynamic";
export default async function ActivityPage({ params }: { params: Promise<{ slug: string }> }) {
  const client = await createClient();
  const { data: { user } } = await client.auth.getUser();
  if (!user) redirect("/auth");
  const profile = await getActivityProfile(client, user.id);
  if (!profile) redirect("/onboarding");
  const { slug } = await params;
  const date = localActivityDate(profile.timezone);
  const daily = dailyActivity(profile, date);
  const activity = slug === "today" ? daily : findActivity(slug);
  if (!activity) notFound();
  const vocabularyCards = [2, 16, 17].includes(activity.id) ? await createStudyDeck(client, user.id, profile.level).catch(() => []) : [];
  return <ActivityPlayer profile={profile} date={date} daily={daily} activity={activity} vocabularyCards={vocabularyCards} />;
}
