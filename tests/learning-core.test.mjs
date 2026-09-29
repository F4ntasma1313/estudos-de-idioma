import assert from "node:assert/strict";
import { mkdtemp, writeFile, rm } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import test from "node:test";
import { previewFile } from "../scripts/seed-vocabulary/Controller/index.ts";
import { reminderIsDue } from "../src/services/push/Controller/index.ts";
import { createCards } from "../src/services/vocabulary/Controller/index.ts";
import { speechSimilarity } from "../src/features/Speaking/Controller/index.ts";
import { countWords } from "../src/features/Writing/Controller/index.ts";
import { writingSubmissionSchema } from "../src/features/Writing/Model/index.ts";
import { readingAnswerSchema } from "../src/features/Reading/Model/index.ts";

test("import preview keeps valid words and identifies duplicate and invalid rows", async () => {
  const directory = await mkdtemp(join(tmpdir(), "english-journey-seed-"));
  try {
    const path = join(directory, "words.json");
    await writeFile(path, JSON.stringify([
      { word: "Hello", translation: "olá", definition_en: "A greeting.", example_en: "Hello, Ana!", cefr_level: "A1", word_type: "expression" },
      { word: "hello", translation: "olá", definition_en: "A greeting.", example_en: "Hello, Ana!", cefr_level: "A1", word_type: "expression" },
      { word: "broken", translation: "", definition_en: "A word.", example_en: "It is broken.", cefr_level: "A1", word_type: "adjective" },
    ]));
    const result = await previewFile(path);
    assert.equal(result.valid.length, 1);
    assert.equal(result.duplicate, 1);
    assert.equal(result.invalid, 1);
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});

test("push reminder follows the user's timezone and half-hour dispatch window", () => {
  const settings = { user_id: "user", timezone: "America/Sao_Paulo", reminder_time: "18:30:00", daily_reminder_enabled: true, push_enabled: true };
  const before = reminderIsDue(settings, new Date("2026-09-29T21:29:00Z"));
  const due = reminderIsDue(settings, new Date("2026-09-29T21:30:00Z"));
  const after = reminderIsDue(settings, new Date("2026-09-29T22:00:00Z"));
  assert.deepEqual(before, { due: false, localDate: "2026-09-29" });
  assert.deepEqual(due, { due: true, localDate: "2026-09-29" });
  assert.deepEqual(after, { due: false, localDate: "2026-09-29" });
  assert.equal(reminderIsDue({ ...settings, daily_reminder_enabled: false }, new Date("2026-09-29T21:30:00Z")).due, false);
});

test("study cards provide four unique choices and a flashcard translation", () => {
  const words = ["hello", "book", "water", "city"].map((word, index) => ({ id: String(index), word, translation: ["olá", "livro", "água", "cidade"][index], phonetic: null, cefr_level: "A1", word_type: "noun", definition_en: "", example_en: "" }));
  const cards = createCards(words, words);
  assert.equal(cards.length, 4);
  for (const card of cards) {
    assert.equal(card.options.length, 4);
    assert.equal(new Set(card.options).size, 4);
    assert.ok(card.options.includes(card.translation));
  }
});

test("speech text comparison ignores case and punctuation but detects different phrases", () => {
  assert.equal(speechSimilarity("Hello, my friend!", "hello my friend"), 100);
  assert.ok(speechSimilarity("I am going to work", "I am going home") < 80);
  assert.equal(speechSimilarity("Hello", ""), 0);
});

test("writing length and reading option are validated before database calls", () => {
  assert.equal(countWords("  I write\nthree words.  "), 4);
  assert.equal(countWords("   "), 0);
  assert.equal(writingSubmissionSchema.safeParse({ challengeId: "00000000-0000-4000-8000-000000000001", bodyEn: "too short" }).success, false);
  assert.equal(readingAnswerSchema.safeParse({ questionId: "00000000-0000-4000-8000-000000000001", optionIndex: 4 }).success, false);
});
