"use client";

import type { SignOutButtonProps } from "../Model";
import { useSignOut } from "../Controller";

export function SignOutButtonView({ userId }: SignOutButtonProps) {
  const { pending, error, signOut } = useSignOut(userId);
  return <div className="text-right"><button onClick={signOut} disabled={pending} className="text-sm font-bold text-muted hover:text-primary disabled:opacity-50">{pending ? "Saindo..." : "Sair"}</button>{error && <p role="alert" className="text-xs text-red-700">{error}</p>}</div>;
}
