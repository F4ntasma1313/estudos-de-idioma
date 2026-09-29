export const benefits = [
  { number: "01", title: "Aprenda no seu ritmo", description: "Uma jornada clara, com metas que cabem na sua rotina." },
  { number: "02", title: "Revise na hora certa", description: "Revisões planejadas para transformar prática em memória." },
  { number: "03", title: "Veja seu progresso", description: "Acompanhe conquistas, sequência de estudos e próximos passos." },
] as const;

export interface LandingViewProps { benefits: typeof benefits; primaryHref: string; secondaryHref: string }
