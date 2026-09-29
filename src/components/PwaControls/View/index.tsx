"use client";

import { usePwaControls } from "../Controller";

export function PwaControlsView() {
  const { canInstall, updateAvailable, install, update } = usePwaControls();
  if (!canInstall && !updateAvailable) return null;
  return <div className="flex items-center gap-2">{canInstall && <button type="button" className="rounded-lg bg-emerald-100 px-3 py-2 text-xs font-bold text-emerald-900" onClick={install}>Instalar aplicativo</button>}{updateAvailable && <button type="button" className="rounded-lg bg-amber-100 px-3 py-2 text-xs font-bold text-amber-900" onClick={update}>Atualizar app</button>}</div>;
}
