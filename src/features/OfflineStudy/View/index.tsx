"use client";

import { Study } from "@/features/Study";
import { useOfflineStudy } from "../Controller";

export function OfflineStudyView() {
  const { userId, level } = useOfflineStudy();
  if (!userId) return <main className="mx-auto max-w-lg p-8"><h1 className="text-2xl font-extrabold">Nenhuma sessão baixada</h1><p className="mt-3 text-muted">Abra a página Estudar enquanto estiver online para preparar uma sessão offline.</p></main>;
  return <Study mode="study" initialLevel={level} userId={userId} />;
}
