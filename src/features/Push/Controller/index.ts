"use client";

import { useState } from "react";

function decodeVapid(value: string): Uint8Array<ArrayBuffer> {
  const padding = "=".repeat((4 - value.length % 4) % 4);
  const binary = atob((value + padding).replace(/-/g, "+").replace(/_/g, "/"));
  const array = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index++) array[index] = binary.charCodeAt(index);
  return array;
}

export function usePushPermission(initialEnabled: boolean) {
  const [enabled, setEnabled] = useState(initialEnabled);
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState("");

  async function subscribe() {
    setPending(true); setMessage("");
    try {
      if (!("serviceWorker" in navigator) || !("PushManager" in window)) throw new Error("Push não é suportado neste navegador.");
      const vapid = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
      if (!vapid) throw new Error("Notificações ainda não foram configuradas no servidor.");
      const permission = await Notification.requestPermission();
      if (permission !== "granted") throw new Error("Permissão de notificação não concedida.");
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: decodeVapid(vapid) });
      const response = await fetch("/api/v1/push/subscribe", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(subscription.toJSON()) });
      if (!response.ok) throw new Error("Não foi possível ativar notificações.");
      setEnabled(true); setMessage("Notificações ativadas neste dispositivo.");
    } catch (cause) { setMessage(cause instanceof Error ? cause.message : "Falha ao ativar notificações."); }
    finally { setPending(false); }
  }

  async function unsubscribe() {
    setPending(true); setMessage("");
    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      if (subscription) {
        const response = await fetch("/api/v1/push/subscribe", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ endpoint: subscription.endpoint }) });
        if (!response.ok) throw new Error("Não foi possível desativar notificações.");
        await subscription.unsubscribe();
      }
      setEnabled(false); setMessage("Notificações desativadas neste dispositivo.");
    } catch (cause) { setMessage(cause instanceof Error ? cause.message : "Falha ao desativar notificações."); }
    finally { setPending(false); }
  }
  return { enabled, pending, message, subscribe, unsubscribe };
}
