"use client";

import { usePronunciation } from "./Controller";
import type { PronunciationProps } from "./Model";
import { PronunciationView } from "./View";

export function Pronunciation({ word, phonetic }: PronunciationProps) {
  const { canSpeak, speak } = usePronunciation(word);
  return <PronunciationView word={word} phonetic={phonetic} canSpeak={canSpeak} speak={speak} />;
}
