"use client";

import { AppShell } from "@/components/AppShell";
import { cefrLevels, type VocabularyViewProps } from "../Model";
import { useVocabulary } from "../Controller";

export function VocabularyView({ initialLevel }: VocabularyViewProps) {
  const state = useVocabulary(initialLevel);
  return <AppShell active="/vocabulary"><div><p className="eyebrow">Explore</p><h1 className="mt-2 text-4xl font-extrabold">Vocabulário</h1><p className="mt-2 text-muted">Encontre palavras, traduções e exemplos de uso.</p></div><div className="mt-7 grid gap-3 sm:grid-cols-[1fr_9rem]"><label className="text-sm font-bold">Buscar<input value={state.query} onChange={(event) => state.setQuery(event.target.value)} className="input mt-2" placeholder="Palavra ou tradução" /></label><label className="text-sm font-bold">Nível<select className="input mt-2" value={state.level} onChange={(event) => state.setLevel(event.target.value)}>{cefrLevels.map((level) => <option key={level}>{level}</option>)}</select></label></div>
    {state.error && <div role="alert" className="surface mt-6 p-5 text-red-700">{state.error}<button className="ml-3 underline" onClick={state.retry}>Tentar novamente</button></div>}
    <div className="mt-7 grid gap-4 md:grid-cols-2">{state.words.map((word) => <article className="surface p-6" key={word.id}><div className="flex items-start justify-between gap-3"><div><h2 className="text-2xl font-extrabold">{word.word}</h2>{word.phonetic && <p className="mt-1 text-sm text-muted">{word.phonetic}</p>}</div><span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-900">{word.cefr_level}</span></div><p className="mt-4 text-lg font-bold text-primary">{word.translation}</p><p className="mt-2 text-sm text-muted">{word.definition_en}</p><p className="mt-3 border-t border-[var(--border)] pt-3 text-sm italic">{word.example_en}</p></article>)}</div>
    {state.loading && <p className="mt-8 text-center text-muted" role="status">Carregando palavras...</p>}{!state.loading && !state.error && state.words.length === 0 && <div className="surface mt-7 p-10 text-center text-muted">Nenhuma palavra encontrada para estes filtros.</div>}{state.cursor && !state.loading && <div className="mt-8 text-center"><button className="button-secondary" onClick={state.more}>Carregar mais</button></div>}
  </AppShell>;
}
