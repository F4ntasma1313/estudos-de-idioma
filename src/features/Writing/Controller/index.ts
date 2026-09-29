"use client";

import { useState } from "react";

export function countWords(value: string): number { return value.trim() ? value.trim().split(/\s+/).length : 0; }

export function useWriting(initialBody: string, challengeId: string, minWords: number) {
  const [body, setBody] = useState(initialBody);
  const [saved, setSaved] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const wordCount = countWords(body);
  function changeBody(value: string) { setBody(value); setSaved(false); }
  async function submit() {
    if (busy) return;
    if (wordCount < minWords) { setError(`Escreva ao menos ${minWords} palavras.`); return; }
    setBusy(true); setSaved(false); setError("");
    try {
      const response = await fetch("/api/v1/writing/submit", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ challengeId, bodyEn: body }) });
      const result = await response.json() as { success: boolean; error: { message: string } | null };
      if (!response.ok || !result.success) throw new Error(result.error?.message ?? "Não foi possível salvar.");
      setSaved(true);
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Não foi possível salvar."); }
    finally { setBusy(false); }
  }
  return { body, changeBody, wordCount, saved, busy, error, submit };
}
