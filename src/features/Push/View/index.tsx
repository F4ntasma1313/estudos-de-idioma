"use client";

import type { PushPermissionProps } from "../Model";
import { usePushPermission } from "../Controller";

export function PushPermissionView({ enabled: initialEnabled }: PushPermissionProps) {
  const { enabled, pending, message, subscribe, unsubscribe } = usePushPermission(initialEnabled);
  return <section className="surface p-6"><h2 className="text-xl font-extrabold">Notificações no dispositivo</h2><p className="mt-2 text-sm text-muted">Receba lembretes de estudo quando permitir notificações no navegador.</p><button type="button" disabled={pending} onClick={enabled ? unsubscribe : subscribe} className="button-secondary mt-5 disabled:opacity-50">{pending ? "Aguarde..." : enabled ? "Desativar neste dispositivo" : "Ativar notificações"}</button>{message && <p role="status" className="mt-3 text-sm text-muted">{message}</p>}</section>;
}
