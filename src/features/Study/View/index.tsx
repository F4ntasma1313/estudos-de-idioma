"use client";

import Link from "next/link";
import { AppShell } from "@/components/AppShell";
import { cefrLevels } from "@/features/Vocabulary/Model";
import { useStudy } from "../Controller";
import type { StudyViewProps } from "../Model";

export function StudyView({ mode, initialLevel, userId, lessonId, lessonTitle }: StudyViewProps) {
  const state = useStudy(mode, initialLevel, userId, lessonId);
  const card = state.cards[state.index];
  const finished = !state.loading && !card && !state.error && state.cards.length > 0;
  const title = mode === "review" ? "Hora de revisar" : mode === "lesson" ? lessonTitle : "Vamos estudar";

  return <AppShell active={mode === "review" ? "/review" : "/study"}>
    <div className="mx-auto max-w-2xl">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div><p className="eyebrow">{mode === "review" ? "Revisão diária" : mode === "lesson" ? "Lição" : "Prática de vocabulário"}</p><h1 className="mt-2 text-3xl font-extrabold sm:text-4xl">{title}</h1></div>
        {mode !== "lesson" && <label className="text-sm font-bold text-muted">Nível<select className="input mt-1 min-w-28" value={state.level} onChange={(event) => state.setLevel(event.target.value)}>{cefrLevels.map((level) => <option key={level}>{level}</option>)}</select></label>}
      </div>
      {mode === "study" && <Link href="/lessons" className="mt-4 inline-block text-sm font-bold text-primary hover:underline">Explorar trilhas e lições →</Link>}
      {state.offline && <p role="status" className="mt-5 rounded-xl bg-amber-100 p-3 text-sm font-bold text-amber-950">Modo offline: suas respostas serão enviadas quando a conexão voltar.</p>}
      {state.loading ? <div className="surface mt-8 p-10 text-center" role="status">Preparando exercícios...</div>
        : state.error ? <div className="surface mt-8 p-8"><p role="alert" className="text-red-700">{state.error}</p><button className="button-secondary mt-4" onClick={state.reload}>Tentar novamente</button></div>
        : finished ? <Finished mode={mode} count={state.cards.length} completion={state.completion} busy={state.submitting} retry={state.reload} />
        : !card ? <div className="surface mt-8 p-10 text-center"><h2 className="text-xl font-bold">{mode === "review" ? "Nenhuma revisão pendente" : "Sem palavras para este nível"}</h2><p className="mt-2 text-muted">{mode === "review" ? "Volte mais tarde ou continue estudando." : "O catálogo deste nível será ampliado em breve."}</p><Link href={mode === "review" ? "/study" : "/vocabulary"} className="button-primary mt-6">{mode === "review" ? "Estudar palavras" : "Ver vocabulário"}</Link></div>
        : <section className="surface mt-8 p-6 sm:p-9">
          <div className="flex items-center justify-between text-sm font-bold text-muted"><span>Palavra {state.index + 1} de {state.cards.length}</span><span>{card.cefrLevel}</span></div>
          <div className="mt-4 h-2 rounded-full bg-emerald-100"><div className="h-2 rounded-full bg-primary transition-all" style={{ width: `${((state.index + 1) / state.cards.length) * 100}%` }} /></div>
          <p className="mt-8 text-sm font-bold text-muted">QUAL É A TRADUÇÃO?</p><h2 className="mt-2 text-5xl font-extrabold">{card.word}</h2>{card.phonetic && <p className="mt-2 text-muted">{card.phonetic}</p>}
          <div className="mt-8 grid gap-3 sm:grid-cols-2">{card.options.map((option) => <button key={option} type="button" disabled={state.submitting || !!state.answer || state.queued} onClick={() => state.choose(option)} className={`min-h-16 rounded-xl border p-4 text-left font-bold transition-colors disabled:cursor-default ${state.answer?.translation === option ? "border-emerald-500 bg-emerald-50 text-emerald-900" : "border-[var(--border)] bg-white hover:border-emerald-400 hover:bg-emerald-50"}`}>{option}</button>)}</div>
          {state.answer && <div role="status" className={`mt-6 rounded-xl p-4 ${state.answer.correct ? "bg-emerald-100 text-emerald-900" : "bg-amber-100 text-amber-950"}`}><p className="font-extrabold">{state.answer.correct ? "Correto!" : "Quase lá!"} {state.answer.awardedXp > 0 && `+${state.answer.awardedXp} XP`}</p>{!!state.answer.missionXp && <p className="mt-1 font-bold">Missão concluída: +{state.answer.missionXp} XP e +{state.answer.coinsAwarded ?? 0} Coins</p>}<p className="mt-1">Tradução: {state.answer.translation}</p><p className="mt-1 text-sm">Domínio: {state.answer.mastery}% · Nível {state.answer.level}</p></div>}
          {state.queued && <p role="status" className="mt-6 rounded-xl bg-amber-100 p-4 font-bold text-amber-950">Resposta salva no dispositivo. A correção aparecerá após sincronizar.</p>}
          {(state.answer || state.queued) && <button className="button-primary mt-6 w-full" onClick={state.next}>Próxima palavra →</button>}
        </section>}
    </div>
  </AppShell>;
}

function Finished({ mode, count, completion, busy, retry }: { mode: StudyViewProps["mode"]; count: number; completion: { completed: boolean; score: number; awardedXp: number } | null; busy: boolean; retry(): void }) {
  return <div className="surface mt-8 p-10 text-center"><span className="text-5xl" aria-hidden>✦</span><h2 className="mt-4 text-2xl font-extrabold">{busy ? "Concluindo lição..." : mode === "lesson" && completion?.completed === false ? "Continue praticando" : "Sessão concluída!"}</h2><p className="mt-2 text-muted">{mode === "lesson" ? completion?.completed ? `Lição concluída com ${completion.score}% de acerto. +${completion.awardedXp} XP` : completion ? `Você precisa de 80% de acerto. Pontuação: ${completion.score}%.` : "Suas respostas offline serão sincronizadas quando voltar a conexão." : `Você praticou ${count} palavras.`}</p><button onClick={retry} className="button-primary mt-6">{mode === "lesson" && completion?.completed === false ? "Tentar novamente" : "Estudar novamente"}</button></div>;
}
