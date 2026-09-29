import { completeOnboarding } from "../Controller";
import type { OnboardingViewProps } from "../Model";

export function OnboardingView({ error }: OnboardingViewProps) {
  return <main className="mx-auto max-w-2xl px-5 py-12 sm:py-20"><p className="eyebrow">Primeiros passos</p><h1 className="mt-3 text-4xl font-extrabold">Vamos montar sua jornada</h1><p className="mt-4 text-muted">Conte um pouco sobre você. Sua meta pode mudar depois.</p><form action={completeOnboarding} className="surface mt-8 space-y-8 p-6 sm:p-9">
    <fieldset><legend className="text-lg font-bold">Qual é seu nível atual?</legend><div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">{[{ value: "A1", label: "Nunca estudei" }, { value: "A2", label: "Básico" }, { value: "B1", label: "Intermediário" }, { value: "B2", label: "Avançado" }, { value: "C1", label: "Muito avançado" }].map(({ value, label }) => <label key={value} className="flex cursor-pointer items-center gap-2 rounded-xl border border-[var(--border)] p-3 text-sm"><input type="radio" name="level" value={value} defaultChecked={value === "A1"} />{label}</label>)}</div></fieldset>
    <label className="block text-lg font-bold">Por que quer aprender inglês?<select className="input mt-3" name="reason" defaultValue="Conversação">{["Viagens", "Trabalho", "Programação", "Negócios", "Estudos", "Conversação", "Outro"].map((item) => <option key={item}>{item}</option>)}</select></label>
    <label className="block text-lg font-bold">Qual será sua meta diária?<select className="input mt-3" name="targetMinutes" defaultValue="20"><option value="10">Casual · 10 minutos</option><option value="20">Normal · 20 minutos</option><option value="30">Sério · 30 minutos</option><option value="60">Intensivo · 60 minutos</option></select></label>
    <label className="block text-lg font-bold">Seu fuso horário<input className="input mt-3" name="timezone" defaultValue="America/Sao_Paulo" required maxLength={80} /></label>
    {error && <p role="alert" className="rounded-xl bg-red-50 p-3 text-sm text-red-800">{error === "invalid" ? "Confira os dados informados." : "Não foi possível salvar. Tente novamente."}</p>}<button type="submit" className="button-primary w-full">Começar minha jornada →</button>
  </form></main>;
}
