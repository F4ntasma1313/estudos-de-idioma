import Link from "next/link";
import { AppShell } from "@/components/AppShell";
import { markNotificationRead } from "../Controller";
import type { NotificationsViewProps } from "../Model";

export function NotificationsView({ items, error, loadError }: NotificationsViewProps) {
  return <AppShell active="/notifications"><div className="mx-auto max-w-3xl"><p className="eyebrow">Sua jornada</p><h1 className="mt-2 text-3xl font-extrabold sm:text-4xl">Notificações</h1><p className="mt-2 text-muted">Lembretes e novidades do seu progresso.</p>
    {error && <p role="alert" className="mt-6 rounded-xl bg-amber-100 p-4 text-amber-950">Não foi possível atualizar a notificação.</p>}
    {loadError ? <section className="surface mt-8 p-8" role="alert"><h2 className="text-xl font-extrabold">Não foi possível carregar</h2><p className="mt-2 text-muted">Atualize a página e tente novamente.</p></section>
      : !items.length ? <section className="surface mt-8 p-8"><h2 className="text-xl font-extrabold">Tudo em dia</h2><p className="mt-2 text-muted">Quando houver lembretes, eles aparecerão aqui.</p><Link href="/study" className="button-primary mt-6">Começar a estudar</Link></section>
      : <ul className="mt-8 space-y-4">{items.map((item) => <li key={item.id} className={`surface p-5 ${item.readAt ? "opacity-75" : "border-emerald-400"}`}><div className="flex flex-wrap items-start justify-between gap-3"><div><p className="text-xs font-bold uppercase tracking-wide text-primary">{item.readAt ? "Lida" : "Nova"} · {new Date(item.createdAt).toLocaleDateString("pt-BR")}</p><h2 className="mt-2 text-lg font-extrabold">{item.title}</h2><p className="mt-2 text-muted">{item.message}</p></div>{!item.readAt && <form action={markNotificationRead}><input type="hidden" name="notificationId" value={item.id} /><button type="submit" className="button-secondary text-sm">Marcar como lida</button></form>}</div>{item.path && <Link href={item.path} className="mt-4 inline-block text-sm font-bold text-primary hover:underline">Abrir atividade →</Link>}</li>)}</ul>}
  </div></AppShell>;
}
