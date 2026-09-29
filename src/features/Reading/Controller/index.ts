"use client";

import { useState } from "react";
import type { ReadingAnswerResult } from "../Model";

export function useReadingAnswers() {
  const [results, setResults] = useState<Record<string, ReadingAnswerResult>>({});
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState("");
  async function answer(questionId: string, optionIndex: number) {
    if (busy || results[questionId]) return;
    setBusy(questionId); setError("");
    try {
      const response = await fetch("/api/v1/reading/answer", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ questionId, optionIndex }) });
      const body = await response.json() as { success: boolean; data: ReadingAnswerResult | null; error: { message: string } | null };
      if (!response.ok || !body.success || !body.data) throw new Error(body.error?.message ?? "Falha ao registrar resposta.");
      setResults((current) => ({ ...current, [questionId]: body.data! }));
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Falha ao registrar resposta."); }
    finally { setBusy(null); }
  }
  return { results, busy, error, answer };
}
