"use client";

import Link from "next/link";
import { AppShell } from "@/components/AppShell";
import { audioRates, type ActivityPlayerProps } from "../Model";
import { useActivityPlayer } from "../Controller";
import { Scene } from "./Scene";

export function ActivityPlayerView(props: ActivityPlayerProps) {
  const { activity, profile, daily } = props;
  const state = useActivityPlayer(props);
  if (state.finished) return <AppShell active="/activities"><div className="mx-auto max-w-2xl"><div className="surface p-8 text-center sm:p-12"><span className="text-5xl" aria-hidden>✦</span><h1 className="mt-4 text-3xl font-extrabold">Atividade concluída!</h1><p className="mt-3 text-muted">Você praticou {activity.title.toLowerCase()} no nível {profile.level}. Pode refazer quando quiser.</p><div className="mt-6 flex flex-wrap justify-center gap-3"><Link href="/activities" className="button-primary">Escolher outra atividade</Link><Link href="/dashboard" className="button-secondary">Voltar ao início</Link></div></div></div></AppShell>;
  const step = state.step;
  return <AppShell active="/activities"><div className="mx-auto max-w-3xl"><Link href="/activities" className="text-sm font-bold text-primary hover:underline">← Todas as atividades</Link><div className="mt-5 flex flex-wrap items-start justify-between gap-4"><div><p className="eyebrow">{activity.category} · nível {profile.level}</p><h1 className="mt-2 text-3xl font-extrabold sm:text-4xl">{activity.icon} {activity.title}</h1><p className="mt-2 text-muted">{activity.summary}</p></div>{daily.slug === activity.slug && <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-900">Atividade de hoje</span>}</div>
    <section className="surface mt-7 p-6 sm:p-9" aria-label="Desafio"><div className="flex items-center justify-between text-sm font-bold text-muted"><span>Etapa {state.index + 1} de {state.stepsCount}</span><span>{profile.level}</span></div><div className="mt-3 h-2 rounded-full bg-emerald-100"><div className="h-2 rounded-full bg-primary" style={{ width: `${((state.index + 1) / state.stepsCount) * 100}%` }} /></div>
      {step.context && <div className="mt-7 whitespace-pre-line rounded-xl bg-emerald-50 p-5 text-base leading-7 text-emerald-950">{step.context}</div>}
      <Scene activityId={activity.id} stepIndex={state.index} solved={state.solved} />
      {step.scene && <div className="mt-4 rounded-xl border border-[var(--border)] p-5 text-center text-4xl" role="img" aria-label="Objetos da cena">{step.scene}</div>}
      <h2 className="mt-6 text-xl font-extrabold leading-8">{state.prompt}</h2><p className="mt-2 text-sm text-muted">{state.levelGuide}</p>
      <div className="mt-5 flex flex-wrap items-center gap-3 rounded-xl border border-[var(--border)] bg-white p-3">
        <button
          type="button"
          className="button-secondary"
          onClick={() => state.speak()}
          disabled={!state.canSpeak || !state.audioText}
        >
          🔊 Ouvir {step.speechText ? "referência" : "texto em inglês"}
        </button>
        <label className="flex items-center gap-2 text-sm font-medium text-muted">
          Velocidade
          <select
            aria-label="Velocidade do áudio"
            className="rounded-lg border border-[var(--border)] bg-white px-3 py-2 text-foreground"
            value={state.audioRate}
            onChange={(event) => state.changeAudioRate(Number(event.target.value))}
            disabled={!state.canSpeak}
          >
            {audioRates.map((rate) => (
              <option key={rate} value={rate}>
                {rate}×
              </option>
            ))}
          </select>
        </label>
        {!state.canSpeak && (
          <span className="text-sm text-muted">Áudio indisponível neste navegador.</span>
        )}
      </div>
      {(step.kind === "choice" || step.kind === "scene") && (
        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          {step.options?.map((option) => (
            <div
              key={option}
              className={`flex min-h-16 items-center rounded-xl border transition hover:border-emerald-400 ${state.selected === option ? "border-emerald-500 bg-emerald-50" : "border-[var(--border)] bg-white"}`}
            >
              <button
                type="button"
                onClick={() => state.choose(option)}
                disabled={state.solved}
                className="min-h-16 flex-1 p-4 text-left font-bold disabled:cursor-default"
                lang="en"
              >
                {option}
              </button>
              <button
                type="button"
                onClick={() => state.speak(option)}
                disabled={!state.canSpeak}
                className="mr-2 rounded-lg p-2 text-primary hover:bg-emerald-100 disabled:opacity-40"
                aria-label={`Ouvir opção: ${option}`}
                title="Ouvir opção"
              >
                🔊
              </button>
            </div>
          ))}
        </div>
      )}
      {step.kind === "text" && <form className="mt-6" onSubmit={(event) => { event.preventDefault(); state.submitText(); }}><label className="text-sm font-bold" htmlFor="activity-answer">Sua resposta</label><input id="activity-answer" className="input mt-2" value={state.answer} onChange={(event) => state.setAnswer(event.target.value)} disabled={state.solved} autoComplete="off" required /><button className="button-primary mt-3" disabled={state.solved}>Conferir</button></form>}
      {step.kind === "order" && (
        <div className="mt-6">
          <p className="text-sm font-bold">Sua sequência</p>
          <div className="mt-2 min-h-16 rounded-xl border border-dashed border-emerald-300 p-3 font-bold" lang="en">
            {state.ordered.length
              ? state.ordered.map((position) => step.tokens?.[position]).join(" ")
              : "Toque nas peças abaixo, na ordem certa."}
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            {step.tokens?.map((token, position) => (
              <div key={`${token}-${position}`} className="flex items-center rounded-lg border border-[var(--border)] bg-white">
                <button
                  type="button"
                  onClick={() => state.addToken(position)}
                  disabled={state.ordered.includes(position) || state.solved}
                  className="px-3 py-2 font-bold disabled:opacity-40"
                  lang="en"
                >
                  {token}
                </button>
                <button
                  type="button"
                  onClick={() => state.speak(token)}
                  disabled={!state.canSpeak}
                  className="p-2 text-primary disabled:opacity-40"
                  aria-label={`Ouvir palavra ou frase: ${token}`}
                >
                  🔊
                </button>
              </div>
            ))}
          </div>
          <div className="mt-4 flex gap-3">
            <button
              type="button"
              className="button-primary"
              onClick={state.submitOrder}
              disabled={state.solved || state.ordered.length !== step.tokens?.length}
            >
              Conferir ordem
            </button>
            <button type="button" className="button-secondary" onClick={state.resetOrder} disabled={state.solved}>
              Recomeçar
            </button>
          </div>
        </div>
      )}
      {step.kind === "write" && <div className="mt-6"><label className="text-sm font-bold" htmlFor="activity-writing">Sua resposta em inglês</label>{state.responses.length > 0 && <p className="mt-2 rounded-lg bg-emerald-50 p-3 text-sm">Sua resposta anterior: {state.responses[state.responses.length - 1]}</p>}<textarea id="activity-writing" className="input mt-2 min-h-36 resize-y" value={state.answer} onChange={(event) => state.setAnswer(event.target.value)} disabled={state.solved} maxLength={2000} /><div className="mt-3 flex flex-wrap items-center gap-3"><button type="button" className="button-primary" onClick={state.submitOpen} disabled={state.solved}>{step.deferModel ? "Revisar minha mensagem" : "Ver exemplo e revisar"}</button>{activity.id === 27 && <span className="text-sm text-muted">{state.answer.trim() ? state.answer.trim().split(/\s+/).length : 0}/30 palavras</span>}</div></div>}
      {step.kind === "record" && <div className="mt-6"><div className="flex flex-wrap gap-3">{activity.id === 10 && state.index === 0 && state.secondsLeft === null && <button type="button" className="button-secondary" onClick={state.startTimer}>Iniciar 15 segundos</button>}{activity.id === 10 && state.index === 0 && state.secondsLeft !== null && <span className="self-center font-bold text-primary">{state.secondsLeft > 0 ? `${state.secondsLeft}s para começar` : "Pode responder agora"}</span>}{state.canRecord && (state.recording ? <button type="button" className="button-secondary" onClick={state.stopRecording}>⏹ Parar gravação</button> : <button type="button" className="button-primary" onClick={() => void state.startRecording()} disabled={state.solved || !state.readyToAnswer}>🎙 Gravar minha voz</button>)}</div>{state.recordingUrl && <div className="mt-4"><p className="mb-2 text-sm font-bold">Sua gravação (só neste dispositivo)</p><audio controls src={state.recordingUrl} className="w-full" /></div>}<label className="mt-5 block text-sm font-bold" htmlFor="activity-spoken-text">Ou escreva sua resposta</label><textarea id="activity-spoken-text" className="input mt-2 min-h-24 resize-y" value={state.answer} onChange={(event) => state.setAnswer(event.target.value)} disabled={state.solved || !state.readyToAnswer} maxLength={1200} /><button type="button" className="button-secondary mt-3" onClick={state.revealRecord} disabled={state.solved || state.recording || !state.readyToAnswer}>Comparar com exemplo</button><p className="mt-2 text-xs text-muted">A gravação não é enviada ao servidor e desaparece ao sair desta tela.</p></div>}
      {step.kind === "route" && <div className="mt-6"><Link href={step.href ?? "/review"} className="button-primary">Abrir revisão espaçada →</Link><p className="mt-3 text-sm text-muted">Depois de praticar, volte a esta tela para registrar a conclusão.</p><button type="button" className="button-secondary mt-4" onClick={state.next}>Já pratiquei hoje</button></div>}
      {state.feedback && <div role="status" className={`mt-5 rounded-xl p-4 text-sm font-medium ${state.feedback.correct ? "bg-emerald-100 text-emerald-900" : "bg-amber-100 text-amber-950"}`}>{state.feedback.message}</div>}
      {!state.solved && state.attempts > 0 && step.hint && <p className="mt-3 text-sm text-muted">Pista: {step.hint}</p>}
      {state.solved && step.deferModel && <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 p-4"><p className="text-xs font-bold uppercase tracking-wider text-emerald-900">Pontos para revisar</p><p className="mt-2">{step.hint}</p></div>}
      {state.solved && step.modelAnswer && !step.deferModel && <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 p-4"><p className="text-xs font-bold uppercase tracking-wider text-emerald-900">Exemplo para comparar</p><p className="mt-2" lang="en">{step.modelAnswer}</p></div>}
      {state.solved && step.kind === "text" && step.answer && (
        <button
          type="button"
          className="button-secondary mt-4"
          onClick={() => state.speak(step.answer)}
          disabled={!state.canSpeak}
        >
          🔊 Ouvir resposta correta
        </button>
      )}
      {state.solved && step.speechText && <p className="mt-3 text-sm text-muted">Áudio de referência: <span lang="en">{step.speechText}</span></p>}
      {state.solved && step.kind !== "route" && <button type="button" className="button-primary mt-6 w-full" onClick={state.next}>{state.index + 1 === state.stepsCount ? "Concluir atividade" : "Próxima etapa →"}</button>}
    </section>
  </div></AppShell>;
}
