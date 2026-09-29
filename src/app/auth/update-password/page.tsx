import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { PasswordUpdate } from "@/features/Auth";

export default async function PasswordUpdatePage() {
  const client = await createClient();
  const { data: { user } } = await client.auth.getUser();
  if (!user) redirect("/auth");
  return <PasswordUpdate />;
}
