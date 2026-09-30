"use client";

import { readablePronunciation, usePronunciation } from "./Controller";
import type { PronunciationProps } from "./Model";
import { PronunciationView } from "./View";

export function Pronunciation({ word, phonetic }: PronunciationProps) {
  const { canSpeak, speak } = usePronunciation(word);
  return <PronunciationView word={word} readable={readablePronunciation(word, phonetic)} canSpeak={canSpeak} speak={speak} />;
}
