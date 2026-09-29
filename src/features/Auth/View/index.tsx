"use client";

import Link from "next/link";
import { useAuth, usePasswordUpdate } from "../Controller";
import type { AuthViewProps } from "../Model";

export function AuthView({ initialMode }: AuthViewProps) {
  const { mode, setMode, pending, message, submit, signInWithGoogle } = useAuth(initialMode);
  const title = mode === "signup" ? "Comece sua jornada" : mode === "recover" ? "Recuperar acesso" : "Boas-vindas de volta";
  return <main className="flex min-h-screen items-center justify-center px-5 py-12"><div className="w-full max-w-md"><Link href="/" className="text-lg font-extrabold text-primary">← English Journey</Link><section className="surface mt-7 p-7 sm:p-9"><p className="eyebrow">Sua jornada começa aqui</p><h1 className="mt-3 text-3xl font-extrabold">{title}</h1><p className="mt-2 text-muted">{mode === "signup" ? "Crie sua conta e escolha sua primeira meta." : mode === "recover" ? "Enviaremos um link para seu e-mail." : "Entre para continuar de onde parou."}</p>
    <form onSubmit={submit} className="mt-7 space-y-4"><label className="block text-sm font-bold">E-mail<input className="input mt-2" name="email" type="email" autoComplete="email" required /></label>{mode !== "recover" && <label className="block text-sm font-bold">Senha<input className="input mt-2" name="password" type="password" autoComplete={mode === "signup" ? "new-password" : "current-password"} minLength={8} required /></label>}{message && <p role="status" className="rounded-xl bg-amber-50 p-3 text-sm text-amber-900">{message}</p>}<button type="submit" disabled={pending} className="button-primary w-full disabled:opacity-50">{pending ? "Aguarde..." : mode === "signup" ? "Criar conta" : mode === "recover" ? "Enviar link" : "Entrar"}</button></form>
    {mode !== "recover" && <><div className="my-5 flex items-center gap-3 text-xs text-muted"><span className="h-px flex-1 bg-[var(--border)]" />ou<span className="h-px flex-1 bg-[var(--border)]" /></div><button type="button" disabled={pending} onClick={signInWithGoogle} className="button-secondary w-full disabled:opacity-50">Continuar com Google</button></>}
    <div className="mt-6 space-y-2 text-center text-sm"><button type="button" onClick={() => { setMode(mode === "signup" ? "login" : "signup"); }} className="font-bold text-primary hover:underline">{mode === "signup" ? "Já tem conta? Entrar" : "Criar uma conta"}</button>{mode !== "recover" && <><br /><button type="button" onClick={() => setMode("recover")} className="text-muted hover:underline">Esqueceu sua senha?</button></>}</div>
  </section></div></main>;
}

export function PasswordUpdateView() {
  const { pending, message, submit } = usePasswordUpdate();
  return <main className="flex min-h-screen items-center justify-center px-5"><section className="surface w-full max-w-md p-8"><p className="eyebrow">Conta</p><h1 className="mt-3 text-3xl font-extrabold">Defina uma nova senha</h1><form onSubmit={submit} className="mt-6 space-y-4"><label className="block text-sm font-bold">Nova senha<input className="input mt-2" name="password" type="password" minLength={8} autoComplete="new-password" required /></label>{message && <p role="status" className="text-sm text-red-700">{message}</p>}<button className="button-primary w-full" disabled={pending}>{pending ? "Salvando..." : "Salvar senha"}</button></form></section></main>;
}
