export const navigation = [
  { href: "/dashboard", label: "Início", symbol: "⌂" },
  { href: "/study", label: "Estudar", symbol: "◈" },
  { href: "/review", label: "Revisar", symbol: "↻" },
  { href: "/vocabulary", label: "Palavras", symbol: "Aa" },
  { href: "/progress", label: "Progresso", symbol: "▥" },
] as const;
export interface AppShellProps { children: React.ReactNode; active: string }
