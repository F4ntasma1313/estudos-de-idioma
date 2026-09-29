"use client";

import { useEffect, useState } from "react";
import type { OfflineStudyState } from "../Model";

export function useOfflineStudy(): OfflineStudyState {
  const [state, setState] = useState<OfflineStudyState>({ userId: null, level: "A1" });
  useEffect(() => {
    const timer = setTimeout(() => setState({ userId: localStorage.getItem("ej-offline-user"), level: localStorage.getItem("ej-offline-level") ?? "A1" }), 0);
    return () => clearTimeout(timer);
  }, []);
  return state;
}
