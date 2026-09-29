"use client";

import { useEffect } from "react";
import type { ThemeChoice } from "../Model";

export function useThemeSync() {
  useEffect(() => {
    const stored = localStorage.getItem("ej-theme");
    const theme: ThemeChoice = stored === "light" || stored === "dark" ? stored : "system";
    document.documentElement.dataset.theme = theme;
  }, []);
}
