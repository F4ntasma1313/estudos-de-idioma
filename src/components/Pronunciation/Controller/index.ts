"use client";

import { useEffect, useState } from "react";

// Uma aproximação para leitura em português; o áudio continua sendo a referência.
const sounds: ReadonlyArray<readonly [string, string, string?]> = [
  ["tʃ", "tch"], ["dʒ", "dj"], ["ŋk", "nk"], ["ŋɡ", "ng"],
  ["aɪ", "ai", "ái"], ["aʊ", "au", "áu"],
  ["eɪ", "ei", "êi"], ["oʊ", "ou", "ôu"], ["ɔɪ", "oi", "ói"],
  ["əɹ", "er"], ["ɜɹ", "âr"], ["ɑɹ", "ar", "ár"], ["ɔɹ", "or", "ór"],
  ["ɚ", "er"], ["ɝ", "âr"], ["æ", "é"], ["ð", "d"], ["ŋ", "ng"],
  ["ɑ", "a", "á"], ["ɒ", "ó"], ["ɔ", "ó"], ["ə", "a"], ["ɛ", "é"],
  ["ɜ", "â"], ["ɡ", "g"], ["ɪ", "i", "í"], ["ɹ", "r"], ["ɾ", "r"],
  ["ʃ", "ch"], ["ʊ", "u", "ú"], ["ʌ", "â"], ["ʒ", "j"], ["θ", "s"],
  ["ʔ", ""], ["a", "a", "á"], ["e", "e", "ê"], ["i", "i", "í"],
  ["o", "o", "ô"], ["u", "u", "ú"], ["j", "i"], ["w", "u"], ["h", "r"],
];

const wordHints: Record<string, string> = {
  schoolboy: "iscúl-bói",
  driver: "dráiver",
  football: "fútból",
  "fifty-five": "fífti-fáiv",
  water: "uóter",
  hello: "relôu",
  you: "iú",
  through: "sru",
  beautiful: "biútiful",
  woman: "úman",
  girl: "gârl",
  language: "lênguídj",
  think: "sínk",
  record: "ricórd",
};

export function readablePronunciation(word: string, phonetic: string | null): string | null {
  if (!phonetic) return null;
  const key = word.toLowerCase();
  const hint = Object.hasOwn(wordHints, key) ? wordHints[key] : undefined;
  if (hint) return hint;

  const chunks = phonetic.replaceAll("/", "").split(/\s+/).filter(Boolean);
  const parts = chunks.map((chunk) => {
    let result = "";
    let pendingStress = false;
    for (let index = 0; index < chunk.length;) {
      const symbol = chunk[index];
      if (symbol === "ˈ" || symbol === "ˌ") { pendingStress = true; index++; continue; }
      const sound = sounds.find(([ipa]) => chunk.startsWith(ipa, index));
      if (sound) {
        result += pendingStress ? (sound[2] ?? sound[1]) : sound[1];
        if (/[aeiouɑæɔəɛɜɪʊʌɚɝ]/u.test(sound[0])) pendingStress = false;
        index += sound[0].length;
      } else {
        result += symbol;
        index++;
      }
    }
    if (/^s[bcdfgklmnprtv]/.test(result)) result = `i${result}`;
    result = result.replace(/(?<=[aeiouáâéêíóôú])s(?=[aeiouáâéêíóôú])/g, "ss");
    result = result.replace(/g(?=[eéêií])/g, "gu");
    return result;
  });
  return parts.join(word.includes("-") ? "-" : " ");
}

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
