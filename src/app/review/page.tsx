import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Study } from "@/features/Study";

export default async function ReviewPage() {
  const client = await createClient();
  const { data: { user } } = await client.auth.getUser();
  if (!user) redirect("/auth");
  const { data } = await client.from("profiles").select("cefr_level").eq("user_id", user.id).single();
  return <Study mode="review" initialLevel={data?.cefr_level ?? "A1"} userId={user.id} />;
}
