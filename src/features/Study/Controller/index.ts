"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { StudyCard, AnswerResult } from "@/features/Vocabulary/Model";
import type { AnswerResponse, DeckResponse, LessonCompletion, StudyMode } from "../Model";
import { deckKey, enqueueAnswer, getDeck, saveDeck, syncPending } from "@/services/offline";

export function useStudy(mode: StudyMode, initialLevel: string, userId: string, lessonId?: string) {
  const [level, setLevel] = useState(initialLevel);
  const [cards, setCards] = useState<StudyCard[]>([]);
  const [index, setIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [answer, setAnswer] = useState<AnswerResult | null>(null);
  const [completion, setCompletion] = useState<LessonCompletion | null>(null);
  const [queued, setQueued] = useState(false);
  const [offline, setOffline] = useState(false);
  const startedAt = useRef(0);
  const operationId = useRef("");

  const load = useCallback(async (signal?: AbortSignal) => {
    setLoading(true); setError(""); setAnswer(null); setCompletion(null); setQueued(false); setIndex(0);
    const key = deckKey(userId, mode, level, lessonId);
    try {
      const url = mode === "lesson" && lessonId ? `/api/v1/lessons/${lessonId}` : `/api/v1/vocabulary/study?level=${level}&mode=${mode}`;
      const response = await fetch(url, { cache: "no-store", signal });
      const body = await response.json() as DeckResponse;
      if (!response.ok || !body.success || !body.data) throw new Error(body.error?.message ?? "Falha ao carregar.");
      setCards(body.data.cards); setOffline(false); startedAt.current = Date.now(); operationId.current = crypto.randomUUID();
      localStorage.setItem("ej-offline-user", userId); localStorage.setItem("ej-offline-level", level);
      await saveDeck(userId, key, body.data.cards).catch(() => {});
    } catch (cause) {
      if (signal?.aborted) return;
      const cached = await getDeck(userId, key).catch(() => null);
      if (cached) { setCards(cached); setOffline(true); startedAt.current = Date.now(); operationId.current = crypto.randomUUID(); }
      else setError(cause instanceof Error ? cause.message : "Falha ao carregar.");
    }
    finally { if (!signal?.aborted) setLoading(false); }
  }, [level, mode, lessonId, userId]);
  useEffect(() => { const controller = new AbortController(); const timer = setTimeout(() => void load(controller.signal), 0); return () => { clearTimeout(timer); controller.abort(); }; }, [load]);
  useEffect(() => {
    const onOnline = () => { void syncPending(userId).catch(() => {}); };
    window.addEventListener("online", onOnline); const timer = setTimeout(onOnline, 0);
    return () => { clearTimeout(timer); window.removeEventListener("online", onOnline); };
  }, [userId]);

  async function choose(option: string) {
    const card = cards[index];
    if (!card || submitting || answer || queued) return;
    setSubmitting(true); setError("");
    const payload = { wordId: card.id, answer: option, operationId: operationId.current, responseTimeMs: Math.min(300000, Date.now() - startedAt.current), lessonId };
    try {
      if (!navigator.onLine) throw new TypeError("Offline");
      const response = await fetch("/api/v1/vocabulary/review", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      const body = await response.json() as AnswerResponse;
      if (!response.ok || !body.success || !body.data) throw new Error(body.error?.message ?? "Falha ao registrar resposta.");
      setAnswer(body.data);
    } catch (cause) {
      if (cause instanceof TypeError) {
        try { await enqueueAnswer({ ...payload, id: payload.operationId, ownerId: userId, queuedAt: Date.now() }); setQueued(true); setOffline(true); }
        catch { setError("Não foi possível salvar a resposta offline."); }
      } else setError(cause instanceof Error ? cause.message : "Falha ao registrar resposta.");
    }
    finally { setSubmitting(false); }
  }

  async function next() {
    setAnswer(null); setQueued(false); setIndex((current) => current + 1); startedAt.current = Date.now(); operationId.current = crypto.randomUUID();
    if (mode === "lesson" && lessonId && index === cards.length - 1 && !offline) {
      setSubmitting(true);
      try {
        const response = await fetch(`/api/v1/lessons/${lessonId}/complete`, { method: "POST" });
        const body = await response.json() as { success: boolean; data: LessonCompletion | null; error: { message: string } | null };
        if (!response.ok || !body.success || !body.data) throw new Error(body.error?.message ?? "Falha ao concluir lição.");
        setCompletion(body.data);
      } catch (cause) { setError(cause instanceof Error ? cause.message : "Falha ao concluir lição."); }
      finally { setSubmitting(false); }
    }
  }
  return { level, setLevel, cards, index, loading, submitting, error, answer, completion, queued, offline, choose, next, reload: () => load() };
}
