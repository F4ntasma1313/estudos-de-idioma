"use client";

import { useEffect, useMemo, useState } from "react";
import { activities } from "../../Model";
import { readCompletions } from "../index";
import { fetchCompletions, postCompletion } from "@/services/activities";

export function useCatalog(userId: string, date: string) {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("Todas");
  const [completed, setCompleted] = useState<string[]>([]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const local = readCompletions(userId, date);
      setCompleted(local);
      void fetchCompletions().then((remote) => {
        const combined = [...new Set([...remote, ...local])];
        setCompleted(combined);
        for (const slug of local) if (!remote.includes(slug)) void postCompletion(slug).catch(() => {});
      }).catch(() => {});
    }, 0);
    return () => window.clearTimeout(timer);
  }, [userId, date]);

  const filtered = useMemo(() => activities.filter((activity) => {
    const matchesCategory = category === "Todas" || activity.category === category;
    const matchesSearch = `${activity.title} ${activity.summary}`.toLocaleLowerCase("pt-BR").includes(search.toLocaleLowerCase("pt-BR").trim());
    return matchesCategory && matchesSearch;
  }), [category, search]);

  return { search, setSearch, category, setCategory, completed, filtered };
}
