"use client";

import Link from "next/link";
import { AppShell } from "@/components/AppShell";
import type { ActivitiesProps } from "../Model";
import { useCatalog } from "../Controller/useCatalog";

const categories = ["Todas", "Vocabulário", "Escuta e fala", "Conversação", "Leitura e escrita", "Aventura"];

export function ActivitiesView({ profile, date, daily }: ActivitiesProps) {
  const state = useCatalog(profile.userId, date);
  return <AppShell active="/activities">
    <div className="flex flex-wrap items-end justify-between gap-4"><div><p className="eyebrow">Pratique do seu jeito</p><h1 className="mt-2 text-4xl font-extrabold">Atividades</h1><p className="mt-2 max-w-2xl text-muted">40 formas de estudar. Os desafios acompanham seu nível {profile.level}; escolha livremente ou siga a sugestão do dia.</p></div><span className="rounded-full bg-emerald-100 px-4 py-2 text-sm font-bold text-emerald-900">Seu nível: {profile.level}</span></div>
    <section className="surface mt-8 overflow-hidden bg-gradient-to-br from-emerald-50 to-white p-6 sm:p-8" aria-label="Atividade do dia"><p className="eyebrow">Sua atividade de hoje · {date.split("-").reverse().join("/")}</p><div className="mt-3 flex flex-wrap items-start justify-between gap-4"><div><h2 className="text-2xl font-extrabold">{daily.icon} {daily.title}</h2><p className="mt-2 max-w-xl text-muted">{daily.summary}</p><p className="mt-2 text-xs font-bold text-primary">Escolhida para seu nível e objetivo: {profile.learningReason ?? "praticar inglês"}.</p></div>{state.completed.includes(daily.slug) && <span className="rounded-full bg-emerald-100 px-3 py-1 text-sm font-bold text-emerald-900">Concluída hoje ✓</span>}</div><Link href={`/activities/${daily.slug}`} className="button-primary mt-5">{state.completed.includes(daily.slug) ? "Praticar novamente" : "Começar atividade de hoje"} →</Link></section>
    <div className="mt-9"><h2 className="text-2xl font-extrabold">Escolha uma atividade</h2><p className="mt-1 text-sm text-muted">Pode repetir qualquer atividade quantas vezes quiser.</p></div>
    <div className="mt-5 grid gap-3 sm:grid-cols-[1fr_auto]"><label className="text-sm font-bold">Buscar<input className="input mt-2" value={state.search} onChange={(event) => state.setSearch(event.target.value)} placeholder="Nome ou habilidade" /></label><label className="text-sm font-bold">Categoria<select className="input mt-2 min-w-48" value={state.category} onChange={(event) => state.setCategory(event.target.value)}>{categories.map((item) => <option key={item}>{item}</option>)}</select></label></div>
    <p className="mt-5 text-sm text-muted" role="status">{state.filtered.length} atividades disponíveis</p>
    <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{state.filtered.map((activity) => <Link href={`/activities/${activity.slug}`} key={activity.slug} className="surface block p-5 transition hover:-translate-y-1 hover:border-emerald-400 hover:shadow-lg"><div className="flex items-start justify-between gap-3"><span className="text-3xl" aria-hidden>{activity.icon}</span><span className="rounded-full bg-emerald-50 px-2 py-1 text-xs font-bold text-primary">{activity.category}</span></div><h3 className="mt-4 text-lg font-extrabold">{activity.id}. {activity.title}</h3><p className="mt-2 text-sm leading-6 text-muted">{activity.summary}</p>{state.completed.includes(activity.slug) && <p className="mt-3 text-xs font-bold text-primary">Concluída hoje ✓</p>}</Link>)}</div>
    {state.filtered.length === 0 && <div className="surface mt-4 p-8 text-center text-muted">Nenhuma atividade corresponde à busca.</div>}
  </AppShell>;
}
