import { argument, hasFlag } from "../shared/index";
import { importVocabulary, previewFile } from "./Controller/index";

async function main() {
  const file = argument("--file", "data/vocabulary-starter.csv");
  if (!file) throw new Error("Informe --file.");
  const preview = await previewFile(file);
  process.stdout.write(`Válidos: ${preview.valid.length}; duplicados no arquivo: ${preview.duplicate}; inválidos: ${preview.invalid}\n`);
  if (!hasFlag("--apply")) { process.stdout.write("Prévia concluída. Use --apply para gravar.\n"); return; }
  const imported = await importVocabulary(preview.valid);
  process.stdout.write(`Upsert concluído: ${imported} registros.\n`);
}
main().catch((error: unknown) => { process.stderr.write(`${error instanceof Error ? error.message : "Falha na importação"}\n`); process.exitCode = 1; });
