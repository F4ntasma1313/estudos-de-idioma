import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Onboarding } from "@/features/Onboarding";

export default async function OnboardingPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const client = await createClient();
  const { data: { user } } = await client.auth.getUser();
  if (!user) redirect("/auth");
  const { data: profile } = await client.from("profiles").select("onboarding_completed_at").eq("user_id", user.id).single();
  if (profile?.onboarding_completed_at) redirect("/dashboard");
  return <Onboarding error={(await searchParams).error} />;
}
