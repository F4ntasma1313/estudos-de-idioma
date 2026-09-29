import Link from "next/link";

export default function OfflinePage() {
  return <main className="flex min-h-screen items-center justify-center px-5"><section className="surface max-w-md p-8 text-center"><span className="text-5xl" aria-hidden>📶</span><h1 className="mt-5 text-3xl font-extrabold">Você está offline</h1><p className="mt-3 leading-7 text-muted">Abra uma sessão baixada para continuar praticando. Suas respostas serão sincronizadas quando a internet voltar.</p><Link href="/offline/study" className="button-primary mt-6">Abrir sessão baixada</Link></section></main>;
}
