"use client";

import Link from "next/link";
import { AppShell } from "@/components/AppShell";
import { cefrLevels } from "@/features/Vocabulary/Model";
import { useSpeaking } from "../Controller";
import type { SpeakingProps } from "../Model";

export function SpeakingView({ initialLevel }: SpeakingProps) {
  const state = useSpeaking(initialLevel);
  const card = state.cards[state.index];
  return <AppShell active="/study"><div className="mx-auto max-w-2xl"><div className="flex flex-wrap items-end justify-between gap-4"><div><p className="eyebrow">Prática de conversação</p><h1 className="mt-2 text-3xl font-extrabold">Repita a frase</h1></div><label className="text-sm font-bold">Nível<select className="input mt-1 min-w-28" value={state.level} onChange={(event) => state.setLevel(event.target.value)}>{cefrLevels.map((level) => <option key={level}>{level}</option>)}</select></label></div>
    <p className="mt-4 text-muted">Ouça a frase e repita em inglês. A pontuação compara o texto reconhecido pelo navegador; ela não mede pronúncia fonética.</p>
    {state.loading ? <div className="surface mt-8 p-8" role="status">Preparando frases...</div> : state.error && !card ? <div className="surface mt-8 p-8"><p role="alert">{state.error}</p><button className="button-secondary mt-4" onClick={state.reload}>Tentar novamente</button></div> : !card ? <div className="surface mt-8 p-8"><h2 className="text-xl font-bold">Sessão concluída</h2><Link href="/study" className="button-primary mt-5">Voltar ao estudo</Link></div> : <section className="surface mt-8 p-7 sm:p-10"><p className="text-sm font-bold text-muted">Frase {state.index + 1} de {state.cards.length} · {card.cefrLevel}</p><h2 className="mt-6 text-3xl font-extrabold leading-snug">{card.exampleEn}</h2><p className="mt-2 text-sm text-muted">Palavra-chave: {card.word}</p><div className="mt-8 flex flex-wrap gap-3"><button type="button" className="button-secondary" onClick={state.hear}>🔊 Ouvir exemplo</button><button type="button" className="button-primary" onClick={state.start} disabled={!state.supported || state.listening}>{state.listening ? "Ouvindo..." : "🎙 Repetir frase"}</button></div>{!state.supported && <p className="mt-4 text-sm text-muted">O reconhecimento de voz não está disponível neste navegador. Você ainda pode ouvir e praticar em voz alta.</p>}{state.error && <p role="alert" className="mt-4 rounded-xl bg-amber-100 p-3 text-sm text-amber-950">{state.error}</p>}{state.result && <div className="mt-6 rounded-xl bg-emerald-100 p-5 text-emerald-950" role="status"><p className="font-extrabold">Correspondência estimada: {state.result.similarity}%</p><p className="mt-2">O navegador reconheceu: “{state.result.transcript}”</p>{card.examplePt && <p lang="pt-BR" className="mt-3">{card.examplePt}</p>}</div>}<button type="button" className="button-secondary mt-8" onClick={state.next}>Próxima frase →</button></section>}
  </div></AppShell>;
}
