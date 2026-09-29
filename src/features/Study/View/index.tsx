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
      {mode === "study" && <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-sm font-bold text-primary"><Link href="/lessons" className="hover:underline">Explorar trilhas e lições →</Link><Link href="/speaking" className="hover:underline">Praticar fala →</Link></div>}
      {mode === "study" && <div className="surface mt-6 grid gap-4 p-4 sm:grid-cols-2"><label className="text-sm font-bold">Tipo de exercício<select className="input mt-2" value={state.format} onChange={(event) => state.changeFormat(event.target.value as typeof state.format)}><option value="choice">Múltipla escolha</option><option value="typing">Digitar tradução</option><option value="listening">Ouvir e responder</option><option value="flashcard">Flashcard livre</option></select></label>{state.format === "listening" && <label className="text-sm font-bold">Velocidade da voz<select className="input mt-2" value={state.speechRate} onChange={(event) => state.setSpeechRate(Number(event.target.value))}><option value="0.5">0,5×</option><option value="0.75">0,75×</option><option value="1">1×</option><option value="1.25">1,25×</option></select></label>}</div>}
      {state.offline && <p role="status" className="mt-5 rounded-xl bg-amber-100 p-3 text-sm font-bold text-amber-950">Modo offline: suas respostas serão enviadas quando a conexão voltar.</p>}
      {state.loading ? <div className="surface mt-8 p-10 text-center" role="status">Preparando exercícios...</div>
        : state.error ? <div className="surface mt-8 p-8"><p role="alert" className="text-red-700">{state.error}</p><button className="button-secondary mt-4" onClick={state.reload}>Tentar novamente</button></div>
        : finished ? <Finished mode={mode} count={state.cards.length} completion={state.completion} busy={state.submitting} retry={state.reload} />
        : !card ? <div className="surface mt-8 p-10 text-center"><h2 className="text-xl font-bold">{mode === "review" ? "Nenhuma revisão pendente" : "Sem palavras para este nível"}</h2><p className="mt-2 text-muted">{mode === "review" ? "Volte mais tarde ou continue estudando." : "O catálogo deste nível será ampliado em breve."}</p><Link href={mode === "review" ? "/study" : "/vocabulary"} className="button-primary mt-6">{mode === "review" ? "Estudar palavras" : "Ver vocabulário"}</Link></div>
        : <section className="surface mt-8 p-6 sm:p-9">
          <div className="flex items-center justify-between text-sm font-bold text-muted"><span>Palavra {state.index + 1} de {state.cards.length}</span><span>{card.cefrLevel}</span></div>
          <div className="mt-4 h-2 rounded-full bg-emerald-100"><div className="h-2 rounded-full bg-primary transition-all" style={{ width: `${((state.index + 1) / state.cards.length) * 100}%` }} /></div>
          <p className="mt-8 text-sm font-bold text-muted">{state.format === "listening" && mode === "study" ? "OUÇA E ENCONTRE A TRADUÇÃO" : state.format === "flashcard" && mode === "study" ? "TENTE LEMBRAR O SIGNIFICADO" : "QUAL É A TRADUÇÃO?"}</p>
          {state.format === "listening" && mode === "study" ? <div className="mt-4"><button type="button" onClick={state.speak} disabled={!state.canSpeak} className="button-secondary min-h-20 w-full text-lg">🔊 Ouvir palavra em inglês</button>{!state.canSpeak && <p className="mt-2 text-sm text-muted">A voz do navegador não está disponível neste dispositivo. Escolha outro tipo de exercício.</p>}</div> : <><h2 className="mt-2 text-5xl font-extrabold">{card.word}</h2>{card.phonetic && <p className="mt-2 text-muted">{card.phonetic}</p>}</>}
          {state.format === "flashcard" && mode === "study" ? <div className="mt-8">{state.revealed ? <div role="status" className="rounded-xl bg-emerald-100 p-5 text-xl font-extrabold text-emerald-900">{card.translation ?? "Tradução indisponível neste deck offline."}</div> : <button type="button" className="button-secondary w-full" onClick={() => state.setRevealed(true)}>Revelar tradução</button>}{state.revealed && <button type="button" className="button-primary mt-5 w-full" onClick={state.next}>Próxima palavra →</button>}<p className="mt-3 text-xs text-muted">Flashcards livres não concedem XP. Para registrar progresso, escolha um exercício corrigido.</p></div>
            : state.format === "typing" && mode === "study" ? <form className="mt-8" onSubmit={(event) => { event.preventDefault(); void state.choose(state.typedAnswer); }}><label htmlFor="typed-translation" className="text-sm font-bold">Digite a tradução em português</label><input id="typed-translation" className="input mt-2" value={state.typedAnswer} onChange={(event) => state.setTypedAnswer(event.target.value)} disabled={state.submitting || !!state.answer || state.queued} autoComplete="off" maxLength={200} required /><button className="button-primary mt-4 w-full" type="submit" disabled={state.submitting || !!state.answer || state.queued}>{state.submitting ? "Corrigindo..." : "Conferir resposta"}</button></form>
            : <div className="mt-8 grid gap-3 sm:grid-cols-2">{card.options.map((option) => <button key={option} type="button" disabled={state.submitting || !!state.answer || state.queued} onClick={() => state.choose(option)} className={`min-h-16 rounded-xl border p-4 text-left font-bold transition-colors disabled:cursor-default ${state.answer?.translation === option ? "border-emerald-500 bg-emerald-50 text-emerald-900" : "border-[var(--border)] bg-white hover:border-emerald-400 hover:bg-emerald-50"}`}>{option}</button>)}</div>}
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
