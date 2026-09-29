"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { StudyCard } from "@/features/Vocabulary/Model";
import type { SpeakingDeckResponse, SpeakingResult, SpeechRecognitionAdapter, SpeechWindow } from "../Model";

function normalized(value: string): string {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9\s]/g, " ").replace(/\s+/g, " ").trim();
}

export function speechSimilarity(expected: string, received: string): number {
  const left = normalized(expected);
  const right = normalized(received);
  if (!left || !right) return 0;
  let previous = Array.from({ length: right.length + 1 }, (_, index) => index);
  for (let row = 1; row <= left.length; row++) {
    const current = [row];
    for (let column = 1; column <= right.length; column++) {
      current[column] = Math.min(current[column - 1] + 1, previous[column] + 1, previous[column - 1] + (left[row - 1] === right[column - 1] ? 0 : 1));
    }
    previous = current;
  }
  return Math.max(0, Math.round((1 - previous[right.length] / Math.max(left.length, right.length)) * 100));
}

export function useSpeaking(initialLevel: string) {
  const [level, setLevel] = useState(initialLevel);
  const [cards, setCards] = useState<StudyCard[]>([]);
  const [index, setIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [listening, setListening] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<SpeakingResult | null>(null);
  const [supported, setSupported] = useState(false);
  const recognition = useRef<SpeechRecognitionAdapter | null>(null);

  const load = useCallback(async (signal?: AbortSignal) => {
    setLoading(true); setError(""); setResult(null); setIndex(0); setCards([]);
    try {
      const response = await fetch(`/api/v1/vocabulary/study?level=${level}`, { signal, cache: "no-store" });
      const body = await response.json() as SpeakingDeckResponse;
      if (!response.ok || !body.success || !body.data) throw new Error(body.error?.message ?? "Não foi possível carregar as frases.");
      setCards(body.data.cards.filter((card) => !!card.exampleEn));
    } catch (cause) {
      if (!signal?.aborted) setError(cause instanceof Error ? cause.message : "Não foi possível carregar as frases.");
    } finally { if (!signal?.aborted) setLoading(false); }
  }, [level]);

  useEffect(() => {
    const controller = new AbortController();
    const timer = setTimeout(() => void load(controller.signal), 0);
    const browser = window as SpeechWindow;
    setTimeout(() => setSupported(!!(browser.SpeechRecognition ?? browser.webkitSpeechRecognition)), 0);
    return () => { clearTimeout(timer); controller.abort(); recognition.current?.stop(); };
  }, [load]);

  function hear() {
    const card = cards[index];
    if (!card || !("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(card.exampleEn);
    utterance.lang = "en-US"; utterance.rate = 0.85;
    window.speechSynthesis.speak(utterance);
  }

  function start() {
    const card = cards[index];
    const browser = window as SpeechWindow;
    const Recognition = browser.SpeechRecognition ?? browser.webkitSpeechRecognition;
    if (!card || !Recognition) return;
    recognition.current?.stop();
    const instance = new Recognition();
    instance.lang = "en-US"; instance.continuous = false; instance.interimResults = false;
    instance.onresult = (event) => {
      const transcript = event.results[0]?.[0]?.transcript ?? "";
      setResult({ transcript, similarity: speechSimilarity(card.exampleEn, transcript) });
      setError(""); setListening(false);
    };
    instance.onerror = (event) => { setError(event.error === "not-allowed" ? "Permita o uso do microfone para praticar fala." : "Não foi possível reconhecer a fala. Tente novamente."); setListening(false); };
    instance.onend = () => setListening(false);
    try { instance.start(); recognition.current = instance; setListening(true); setResult(null); setError(""); }
    catch { setError("Não foi possível iniciar o microfone."); setListening(false); }
  }

  function next() { recognition.current?.stop(); setResult(null); setError(""); setIndex((value) => value + 1); }
  return { level, setLevel, cards, index, loading, listening, error, result, supported, hear, start, next, reload: () => load() };
}
