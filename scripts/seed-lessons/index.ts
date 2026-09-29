import { createAdminClient } from "../shared/index";

const tracks = [
  { slug: "english-basics", title: "Inglês Básico", description: "Vocabulário e frases do dia a dia.", cefr_level: "A1", published: true },
  { slug: "english-intermediate", title: "Inglês Intermediário", description: "Expanda sua comunicação.", cefr_level: "B1", published: true },
  { slug: "english-for-developers", title: "Inglês para Programadores", description: "Comunique-se melhor em tecnologia.", cefr_level: "B1", published: true },
];

async function main() {
  const client = createAdminClient();
  const { error } = await client.from("tracks").upsert(tracks, { onConflict: "slug" });
  if (error) throw error;
  process.stdout.write("Trilhas atualizadas. A migration 003 contém módulos, lições e exercícios iniciais.\n");
}
main().catch((error: unknown) => { process.stderr.write(`${error instanceof Error ? error.message : "Falha no seed"}\n`); process.exitCode = 1; });
