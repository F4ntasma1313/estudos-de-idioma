"use client";

import { useCallback, useEffect, useState } from "react";
import type { VocabularyWord } from "../Model";

interface SearchResponse { success: boolean; data: { words: VocabularyWord[]; nextCursor: string | null } | null; error: { message: string } | null }

export function useVocabulary(initialLevel: string) {
  const [level, setLevel] = useState(initialLevel);
  const [query, setQuery] = useState("");
  const [words, setWords] = useState<VocabularyWord[]>([]);
  const [cursor, setCursor] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async (nextCursor?: string, signal?: AbortSignal) => {
    setLoading(true); setError("");
    try {
      const params = new URLSearchParams({ level });
      if (query.trim()) params.set("q", query.trim());
      if (nextCursor) params.set("cursor", nextCursor);
      const response = await fetch(`/api/v1/vocabulary?${params}`, { cache: "no-store", signal });
      const body = await response.json() as SearchResponse;
      if (!response.ok || !body.success || !body.data) throw new Error(body.error?.message ?? "Falha ao buscar palavras.");
      setWords((previous) => nextCursor ? [...previous, ...body.data!.words] : body.data!.words);
      setCursor(body.data.nextCursor);
    } catch (cause) { if (!signal?.aborted) setError(cause instanceof Error ? cause.message : "Falha ao buscar palavras."); }
    finally { if (!signal?.aborted) setLoading(false); }
  }, [level, query]);
  useEffect(() => { const controller = new AbortController(); const timer = setTimeout(() => void load(undefined, controller.signal), 250); return () => { clearTimeout(timer); controller.abort(); }; }, [load]);
  return { level, setLevel, query, setQuery, words, cursor, loading, error, more: () => cursor && load(cursor), retry: () => load() };
}
