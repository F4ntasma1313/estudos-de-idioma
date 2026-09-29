"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { clearOfflineUser } from "@/services/offline";
import { createClient } from "@/lib/supabase/browser";

export function useSignOut(userId: string) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  async function signOut() {
    setPending(true); setError("");
    try {
      const { error: authError } = await createClient().auth.signOut();
      if (authError) throw authError;
      await clearOfflineUser(userId).catch(() => {});
      localStorage.removeItem("ej-offline-user"); localStorage.removeItem("ej-offline-level");
      router.replace("/"); router.refresh();
    } catch { setError("Não foi possível sair. Tente novamente."); setPending(false); }
  }
  return { pending, error, signOut };
}
