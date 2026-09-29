"use client";

import Link from "next/link";
import { AppShell } from "@/components/AppShell";
import { useReadingAnswers } from "../Controller";
import type { ReadingDetailProps, ReadingListProps } from "../Model";

export function ReadingListView({ passages }: ReadingListProps) {
  return <AppShell active="/study"><p className="eyebrow">Compreensão de texto</p><h1 className="mt-2 text-3xl font-extrabold">Reading</h1><p className="mt-2 text-muted">Leia em inglês e responda às perguntas para praticar compreensão.</p>{passages.length ? <div className="mt-8 grid gap-4 sm:grid-cols-2">{passages.map((passage) => <Link key={passage.id} href={`/reading/${passage.id}`} className="surface p-6 hover:border-emerald-400"><span className="eyebrow">{passage.cefrLevel}</span><h2 className="mt-3 text-xl font-extrabold">{passage.title}</h2><p className="mt-2 line-clamp-3 text-sm text-muted">{passage.bodyEn}</p><span className="mt-4 inline-block text-sm font-bold text-primary">Ler texto →</span></Link>)}</div> : <div className="surface mt-8 p-8">Nenhum texto publicado ainda.</div>}</AppShell>;
}

export function ReadingDetailView({ passage, questions }: ReadingDetailProps) {
  const state = useReadingAnswers();
  return <AppShell active="/study"><div className="mx-auto max-w-3xl"><Link href="/reading" className="text-sm font-bold text-primary hover:underline">← Todos os textos</Link><p className="eyebrow mt-7">Leitura · {passage.cefrLevel}</p><h1 className="mt-2 text-3xl font-extrabold">{passage.title}</h1><article className="surface mt-7 p-7 text-lg leading-9 sm:p-10" lang="en">{passage.bodyEn}</article><h2 className="mt-10 text-2xl font-extrabold">Perguntas</h2>{state.error && <p role="alert" className="mt-4 rounded-xl bg-red-50 p-4 text-red-800">{state.error}</p>}{questions.length ? <div className="mt-5 space-y-5">{questions.map((question) => { const result = state.results[question.id]; return <section key={question.id} className="surface p-6"><h3 className="text-lg font-extrabold">{question.position}. {question.prompt}</h3><div className="mt-4 grid gap-3 sm:grid-cols-2">{question.options.map((option, index) => <button key={index} type="button" disabled={!!result || !!state.busy} onClick={() => state.answer(question.id, index)} className={`rounded-xl border p-4 text-left font-bold ${result?.correctIndex === index ? "border-emerald-500 bg-emerald-50 text-emerald-900" : "border-[var(--border)] hover:border-emerald-400"}`}>{option}</button>)}</div>{result && <p role="status" className={`mt-5 rounded-xl p-4 ${result.correct ? "bg-emerald-100 text-emerald-900" : "bg-amber-100 text-amber-950"}`}><strong>{result.correct ? "Correto!" : "Resposta incorreta."}</strong> {result.awardedXp > 0 && `+${result.awardedXp} XP. `}{result.explanation}</p>}</section>; })}</div> : <div className="surface mt-5 p-6">Este texto ainda não tem perguntas.</div>}</div></AppShell>;
}
