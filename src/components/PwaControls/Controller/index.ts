"use client";

import { useEffect, useRef, useState } from "react";
import type { InstallPromptEvent, PwaControlState } from "../Model";

export function usePwaControls(): PwaControlState {
  const promptRef = useRef<InstallPromptEvent | null>(null);
  const registrationRef = useRef<ServiceWorkerRegistration | null>(null);
  const [canInstall, setCanInstall] = useState(false);
  const [updateAvailable, setUpdateAvailable] = useState(false);

  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;
    let active = true;
    navigator.serviceWorker.register("/sw.js").then((registration) => {
      if (!active) return;
      registrationRef.current = registration;
      if (registration.waiting) setUpdateAvailable(true);
      registration.addEventListener("updatefound", () => {
        registration.installing?.addEventListener("statechange", () => {
          if (registration.waiting && navigator.serviceWorker.controller) setUpdateAvailable(true);
        });
      });
    }).catch(() => { /* PWA is optional when browser policy blocks workers. */ });
    const onPrompt = (event: Event) => { event.preventDefault(); promptRef.current = event as InstallPromptEvent; setCanInstall(true); };
    const onControllerChange = () => window.location.reload();
    window.addEventListener("beforeinstallprompt", onPrompt);
    navigator.serviceWorker.addEventListener("controllerchange", onControllerChange);
    return () => { active = false; window.removeEventListener("beforeinstallprompt", onPrompt); navigator.serviceWorker.removeEventListener("controllerchange", onControllerChange); };
  }, []);

  async function install() { if (!promptRef.current) return; await promptRef.current.prompt(); await promptRef.current.userChoice; promptRef.current = null; setCanInstall(false); }
  function update() { registrationRef.current?.waiting?.postMessage({ type: "SKIP_WAITING" }); }
  return { canInstall, updateAvailable, install, update };
}
