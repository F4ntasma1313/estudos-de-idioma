import type { CompletionResponse } from "../Model";

export async function fetchCompletions(): Promise<string[]> {
  const response = await fetch("/api/v1/activities", { cache: "no-store" });
  if (!response.ok) throw new Error("Progresso online indisponível.");
  const body = await response.json() as CompletionResponse;
  return Array.isArray(body.completed) ? body.completed : [];
}

export async function postCompletion(slug: string): Promise<void> {
  const response = await fetch("/api/v1/activities", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ slug }) });
  if (!response.ok) throw new Error("Progresso online indisponível.");
}
