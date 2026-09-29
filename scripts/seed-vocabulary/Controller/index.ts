import { readFile } from "node:fs/promises";
import { extname } from "node:path";
import { parse as parseCsv } from "csv-parse/sync";
import { createAdminClient } from "../../shared/index";
import { vocabularyRowSchema, type SeedPreview, type VocabularyRow } from "../Model/index";

export async function previewFile(path: string): Promise<SeedPreview> {
  const content = await readFile(path, "utf8");
  const extension = extname(path).toLowerCase();
  const raw: unknown = extension === ".json" ? JSON.parse(content) : extension === ".csv" ? parseCsv(content, { columns: true, skip_empty_lines: true, bom: true, trim: true }) : null;
  if (!Array.isArray(raw)) throw new Error("Use um arquivo JSON (array) ou CSV com cabeçalho.");
  const valid: VocabularyRow[] = []; const seen = new Set<string>();
  let invalid = 0; let duplicate = 0;
  for (const item of raw) {
    const result = vocabularyRowSchema.safeParse(item);
    if (!result.success) { invalid++; continue; }
    const key = result.data.word.toLocaleLowerCase("en-US");
    if (seen.has(key)) { duplicate++; continue; }
    seen.add(key); valid.push(result.data);
  }
  return { valid, invalid, duplicate };
}

export async function importVocabulary(rows: VocabularyRow[]): Promise<number> {
  const client = createAdminClient();
  const { data: categories, error } = await client.from("vocabulary_categories").select("id,slug");
  if (error) throw error;
  const categoryIds = new Map((categories ?? []).map((category) => [category.slug, category.id]));
  const missing = [...new Set(rows.map((row) => row.category_slug))].filter((slug) => !categoryIds.has(slug));
  if (missing.length) throw new Error(`Categorias não encontradas: ${missing.join(", ")}. Rode npm run seed:categories primeiro.`);
  let imported = 0;
  for (let index = 0; index < rows.length; index += 200) {
    const batch = rows.slice(index, index + 200).map(({ category_slug, ...word }) => ({ ...word, category_id: categoryIds.get(category_slug) }));
    const result = await client.from("vocabulary_words").upsert(batch, { onConflict: "word_key" });
    if (result.error) throw result.error;
    imported += batch.length;
  }
  return imported;
}
