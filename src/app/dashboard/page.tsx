import { redirect } from "next/navigation";
import { loadDashboard } from "@/features/Dashboard/Controller";
import { Dashboard } from "@/features/Dashboard";

export const dynamic = "force-dynamic";
export default async function DashboardPage() {
  const result = await loadDashboard();
  if (result.status === "unauthorized") redirect("/auth");
  if (result.status === "onboarding") redirect("/onboarding");
  return <Dashboard data={result.data} daily={result.daily} goalPercent={result.goalPercent} />;
}
