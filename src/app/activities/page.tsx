import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getActivityProfile } from "@/repositories/activities";
import { dailyActivity, localActivityDate } from "@/features/Activities/Controller";
import { Activities } from "@/features/Activities";

export const dynamic = "force-dynamic";
export default async function ActivitiesPage() {
  const client = await createClient();
  const { data: { user } } = await client.auth.getUser();
  if (!user) redirect("/auth");
  const profile = await getActivityProfile(client, user.id);
  if (!profile) redirect("/onboarding");
  const date = localActivityDate(profile.timezone);
  return <Activities profile={profile} date={date} daily={dailyActivity(profile, date)} />;
}
