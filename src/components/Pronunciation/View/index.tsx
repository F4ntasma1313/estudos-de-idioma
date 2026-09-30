import { Volume2 } from "lucide-react";
import type { PronunciationViewProps } from "../Model";

export function PronunciationView({ word, phonetic, canSpeak, speak }: PronunciationViewProps) {
  return <span className="inline-flex flex-wrap items-center gap-x-2 gap-y-1 align-middle">
    {phonetic && <span className="text-base font-medium text-muted" aria-label={`Pronúncia americana: ${phonetic}`}>{phonetic}</span>}
    {canSpeak && <button type="button" onClick={speak} className="inline-flex min-h-9 min-w-9 items-center justify-center rounded-full text-primary hover:bg-emerald-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary" aria-label={`Ouvir ${word} em inglês americano`} title={`Ouvir ${word} em inglês americano`}><Volume2 size={18} aria-hidden="true" /></button>}
  </span>;
}
