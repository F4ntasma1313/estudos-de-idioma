"use client";

import { usePwaControls } from "../Controller";

export function PwaControlsView() {
  const { canInstall, updateAvailable, install, update } = usePwaControls();
  if (!canInstall && !updateAvailable) return null;
  return <div className="flex items-center gap-2">{canInstall && <button type="button" className="rounded-lg bg-emerald-100 px-2 py-2 text-xs font-bold text-emerald-900 sm:px-3" onClick={install}><span className="sm:hidden">Instalar</span><span className="hidden sm:inline">Instalar aplicativo</span></button>}{updateAvailable && <button type="button" className="rounded-lg bg-amber-100 px-2 py-2 text-xs font-bold text-amber-900 sm:px-3" onClick={update}><span className="sm:hidden">Atualizar</span><span className="hidden sm:inline">Atualizar app</span></button>}</div>;
}
