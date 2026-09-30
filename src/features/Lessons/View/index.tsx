import Link from "next/link";
import { AppShell } from "@/components/AppShell";
import { cefrLevels } from "@/features/Vocabulary/Model";
import type { LessonsViewProps } from "../Model";

export function LessonsView({ tracks, selectedLevel, activityCount }: LessonsViewProps) {
  return <AppShell active="/study">
    <p className="eyebrow">Aprendizagem guiada</p>
    <h1 className="mt-2 text-4xl font-extrabold">Trilhas e atividades</h1>
    <p className="mt-2 text-muted">Escolha um nível e avance por blocos de até 25 palavras. Cada palavra do catálogo aparece em uma atividade.</p>
    <nav className="mt-7 flex flex-wrap gap-2" aria-label="Níveis de inglês">
      {cefrLevels.map((level) => <Link key={level} href={`/lessons?level=${level}`} aria-current={selectedLevel === level ? "page" : undefined} className={selectedLevel === level ? "button-primary" : "button-secondary"}>{level}</Link>)}
    </nav>
    <p className="mt-5 text-sm font-bold text-muted">{activityCount} atividades no nível {selectedLevel}</p>
    {tracks.length ? <div className="mt-6 space-y-6">{tracks.map((track) => <section className="surface p-6 sm:p-8" key={track.id}>
      <h2 className="text-2xl font-extrabold">{track.title}</h2>
      <p className="mt-2 text-muted">{track.description}</p>
      <div className="mt-6 space-y-3">{track.modules.map((module) => <details key={module.id} className="rounded-xl border border-[var(--border)] bg-white p-4">
        <summary className="cursor-pointer font-extrabold">Bloco {module.position} · {module.title} · {module.lessons.length} atividades</summary>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">{module.lessons.map((lesson) => <Link href={`/lessons/${lesson.id}`} key={lesson.id} className="rounded-xl border border-[var(--border)] p-4 transition hover:border-emerald-400">
          <span className="font-extrabold">{lesson.title}</span>
          <span className="ml-2 text-sm text-primary">{lesson.completed ? "✓ Concluída" : "Iniciar →"}</span>
          <p className="mt-2 text-sm text-muted">{lesson.description}</p>
        </Link>)}</div>
      </details>)}</div>
    </section>)}</div> : <div className="surface mt-8 p-10 text-center text-muted">As atividades aparecerão após importar o catálogo.</div>}
  </AppShell>;
}
