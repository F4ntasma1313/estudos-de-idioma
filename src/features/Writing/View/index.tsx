"use client";

import Link from "next/link";
import { AppShell } from "@/components/AppShell";
import { useWriting } from "../Controller";
import type { WritingDetailProps, WritingListProps } from "../Model";

export function WritingListView({ challenges }: WritingListProps) {
  return <AppShell active="/study"><p className="eyebrow">Produção escrita</p><h1 className="mt-2 text-3xl font-extrabold">Writing</h1><p className="mt-2 text-muted">Escreva em inglês sobre temas do seu nível e acompanhe seus rascunhos.</p>{challenges.length ? <div className="mt-8 grid gap-4 sm:grid-cols-2">{challenges.map((challenge) => <Link key={challenge.id} href={`/writing/${challenge.id}`} className="surface p-6 hover:border-emerald-400"><span className="eyebrow">{challenge.cefrLevel}</span><h2 className="mt-3 text-xl font-extrabold">{challenge.title}</h2><p className="mt-2 text-sm text-muted">{challenge.promptPt}</p><span className="mt-4 inline-block text-sm font-bold text-primary">Escrever →</span></Link>)}</div> : <div className="surface mt-8 p-8">Nenhum desafio publicado ainda.</div>}</AppShell>;
}

export function WritingDetailView({ challenge, submission }: WritingDetailProps) {
  const state = useWriting(submission?.bodyEn ?? "", challenge.id, challenge.minWords);
  return <AppShell active="/study"><div className="mx-auto max-w-3xl"><Link href="/writing" className="text-sm font-bold text-primary hover:underline">← Todos os desafios</Link><p className="eyebrow mt-7">Escrita · {challenge.cefrLevel}</p><h1 className="mt-2 text-3xl font-extrabold">{challenge.title}</h1><div className="surface mt-7 p-7"><p className="text-lg font-bold">{challenge.promptPt}</p><p className="mt-2 text-sm text-muted">Mínimo: {challenge.minWords} palavras. Seu texto é privado e pode ser editado depois.</p><label htmlFor="writing-body" className="mt-7 block text-sm font-bold">Seu texto em inglês</label><textarea id="writing-body" className="input mt-2 min-h-64 resize-y" lang="en" value={state.body} onChange={(event) => state.changeBody(event.target.value)} maxLength={5000} placeholder="Start writing here..." /><p className="mt-2 text-sm text-muted">{state.wordCount} palavras · até 5.000 caracteres</p>{state.error && <p role="alert" className="mt-4 rounded-xl bg-red-50 p-3 text-red-800">{state.error}</p>}{state.saved && <p role="status" className="mt-4 rounded-xl bg-emerald-100 p-3 text-emerald-900">Texto salvo com sucesso.</p>}<button type="button" className="button-primary mt-5" disabled={state.busy} onClick={state.submit}>{state.busy ? "Salvando..." : submission || state.saved ? "Atualizar texto" : "Salvar texto"}</button><p className="mt-5 text-xs text-muted">Esta versão registra a prática de escrita; não faz correção automática nem concede XP pela quantidade de texto.</p></div></div></AppShell>;
}
