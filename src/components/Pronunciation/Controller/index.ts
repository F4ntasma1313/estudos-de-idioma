"use client";

import { useEffect, useState } from "react";

export function usePronunciation(word: string) {
  const [canSpeak, setCanSpeak] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => setCanSpeak("speechSynthesis" in window && "SpeechSynthesisUtterance" in window), 0);
    return () => window.clearTimeout(timer);
  }, []);

  function speak() {
    if (!canSpeak) return;
    const utterance = new SpeechSynthesisUtterance(word);
    utterance.lang = "en-US";
    utterance.rate = 0.85;
    const americanVoice = window.speechSynthesis.getVoices().find((voice) => voice.lang.toLowerCase() === "en-us");
    if (americanVoice) utterance.voice = americanVoice;
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utterance);
  }

  return { canSpeak, speak };
}
