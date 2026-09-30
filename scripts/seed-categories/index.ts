import { createAdminClient } from "../shared/index";

const categories = [
  ["daily-life","Vida cotidiana"],["family","Família"],["food","Comida"],["travel","Viagens"],
  ["work","Trabalho"],["technology","Tecnologia"],["feelings","Sentimentos"],["nature","Natureza"],
  ["health","Saúde"],["business","Negócios"],["sports","Esportes"],["school","Escola"],
  ["general-vocabulary","Vocabulário geral"],["science","Ciência"],["technical","Termos técnicos"],
  ["arts","Artes"],["law","Direito"],["politics","Política"],
] as const;

async function main() {
  const client = createAdminClient();
  const { error } = await client.from("vocabulary_categories").upsert(categories.map(([slug,name]) => ({ slug,name })), { onConflict: "slug" });
  if (error) throw error;
  process.stdout.write(`${categories.length} categorias atualizadas.\n`);
}
main().catch((error: unknown) => { process.stderr.write(`${error instanceof Error ? error.message : "Falha no seed"}\n`); process.exitCode = 1; });
