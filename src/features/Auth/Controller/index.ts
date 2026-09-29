"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/browser";
import { authSchema, type AuthMode } from "../Model";

export function useAuth(initialMode: AuthMode) {
  const router = useRouter();
  const [mode, setMode] = useState<AuthMode>(initialMode);
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setMessage("");
    const form = new FormData(event.currentTarget);
    const email = String(form.get("email") ?? "").trim();
    const password = String(form.get("password") ?? "");
    if (mode !== "recover") {
      const parsed = authSchema.safeParse({ email, password });
      if (!parsed.success) { setMessage(parsed.error.issues[0]?.message ?? "Confira os dados."); return; }
    } else if (!authSchema.shape.email.safeParse(email).success) { setMessage("Informe um e-mail válido."); return; }
    setPending(true);
    try {
      const client = createClient();
      if (mode === "recover") {
        const { error } = await client.auth.resetPasswordForEmail(email, { redirectTo: `${window.location.origin}/auth/callback?next=/auth/update-password` });
        if (error) throw error;
        setMessage("Se esse e-mail estiver cadastrado, você receberá um link.");
      } else if (mode === "signup") {
        const { data, error } = await client.auth.signUp({ email, password, options: { emailRedirectTo: `${window.location.origin}/auth/callback` } });
        if (error) throw error;
        if (data.session) { router.replace("/onboarding"); router.refresh(); }
        else setMessage("Confira seu e-mail para confirmar a conta.");
      } else {
        const { error } = await client.auth.signInWithPassword({ email, password });
        if (error) throw error;
        router.replace("/dashboard"); router.refresh();
      }
    } catch (error) { setMessage(error instanceof Error ? error.message : "Não foi possível continuar."); }
    finally { setPending(false); }
  }

  async function signInWithGoogle() {
    setPending(true); setMessage("");
    try {
      const { error } = await createClient().auth.signInWithOAuth({ provider: "google", options: { redirectTo: `${window.location.origin}/auth/callback` } });
      if (error) throw error;
    } catch (error) { setMessage(error instanceof Error ? error.message : "Não foi possível entrar com Google."); setPending(false); }
  }

  return { mode, setMode, pending, message, submit, signInWithGoogle };
}

export function usePasswordUpdate() {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState("");
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setMessage("");
    const password = String(new FormData(event.currentTarget).get("password") ?? "");
    if (password.length < 8) { setMessage("Use pelo menos 8 caracteres."); return; }
    setPending(true);
    try {
      const { error } = await createClient().auth.updateUser({ password });
      if (error) throw error;
      router.replace("/dashboard"); router.refresh();
    } catch (error) { setMessage(error instanceof Error ? error.message : "Não foi possível atualizar a senha."); }
    finally { setPending(false); }
  }
  return { pending, message, submit };
}
