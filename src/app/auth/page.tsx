import { Auth } from "@/features/Auth";

export default async function AuthPage({ searchParams }: { searchParams: Promise<{ mode?: string }> }) {
  const { mode } = await searchParams;
  return <Auth mode={mode === "signup" ? "signup" : "login"} />;
}
