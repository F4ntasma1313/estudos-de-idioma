import { z } from "zod";

export const vocabularyRowSchema = z.object({
  word: z.string().trim().min(1).max(120), translation: z.string().trim().min(1).max(200),
  definition_en: z.string().trim().min(1), example_en: z.string().trim().min(1),
  cefr_level: z.enum(["A1","A2","B1","B2","C1","C2"]),
  word_type: z.enum(["noun","verb","adjective","adverb","pronoun","preposition","conjunction","expression","phrasal_verb"]),
  category_slug: z.string().trim().min(1).default("daily-life"),
  phonetic: z.string().optional(), definition_pt: z.string().optional(), example_pt: z.string().optional(),
  frequency_rank: z.coerce.number().int().positive().optional(), image_url: z.url().optional(), audio_url: z.url().optional(),
});
export type VocabularyRow = z.infer<typeof vocabularyRowSchema>;
export interface SeedPreview { valid: VocabularyRow[]; invalid: number; duplicate: number }
