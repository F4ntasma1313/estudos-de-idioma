import { createClient } from "@/lib/supabase/server";
import { getDashboardData } from "@/repositories/dashboard";

export async function loadDashboard() {
  const client = await createClient();
  const { data: { user } } = await client.auth.getUser();
  if (!user) return { status: "unauthorized" as const };
  const data = await getDashboardData(client, user.id);
  if (!data) return { status: "onboarding" as const };
  return { status: "ready" as const, data };
}

export async function signOut() {
  "use server";
  const client = await createClient();
  await client.auth.signOut();
  const { redirect } = await import("next/navigation");
  redirect("/");
}
