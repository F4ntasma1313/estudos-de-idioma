import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Speaking } from "@/features/Speaking";

export default async function SpeakingPage() {
  const client = await createClient();
  const { data: { user } } = await client.auth.getUser();
  if (!user) redirect("/auth");
  const { data } = await client.from("profiles").select("cefr_level").eq("user_id", user.id).single();
  return <Speaking initialLevel={data?.cefr_level ?? "A1"} />;
}
