import assert from "node:assert/strict";
import test from "node:test";
import { activities } from "../src/features/Activities/Model/index.ts";
import { activityAudioText, activitySteps, dailyActivity, incorrectActivityFeedback, localActivityDate, normalizeAnswer } from "../src/features/Activities/Controller/index.ts";

const profile = { userId: "00000000-0000-4000-8000-000000000001", level: "A2", learningReason: "Viagens", timezone: "America/Sao_Paulo", dueWords: 0 };

test("all forty activities have distinct playable challenges", () => {
  assert.equal(activities.length, 40);
  assert.deepEqual(activities.map((item) => item.id), Array.from({ length: 40 }, (_, index) => index + 1));
  assert.equal(new Set(activities.map((item) => item.slug)).size, 40);
  for (const activity of activities) {
    assert.ok(activity.title && activity.summary && activity.steps.length, activity.slug);
    for (const step of activity.steps) {
      assert.ok(step.prompt, activity.slug);
      if (["choice", "scene"].includes(step.kind)) assert.ok(step.options?.includes(step.answer), activity.slug);
      if (step.kind === "text" || step.kind === "order") assert.ok(step.answer, activity.slug);
      if (step.kind === "write" || step.kind === "record") assert.ok(step.modelAnswer, activity.slug);
      if (step.kind === "route") assert.equal(step.href, "/review");
    }
  }
});

test("closed challenges require English answers across levels", () => {
  const portugueseChoices = /\b(?:livro|cadeira|caneta|debaixo|atr[aá]s|dentro|margem|institui[cç][aã]o|atualmente|chuva|nenhum|ambos|caixa|tela|amarelo|vermelho|suco|sopa|salada|nada|pedir|mandar|ignorar|trocar)\b/i;
  for (const activity of activities) {
    for (const level of ["A1", "A2", "B1", "B2", "C1", "C2"]) {
      for (const step of activitySteps(activity, level)) {
        if (step.kind !== "choice" && step.kind !== "scene") continue;
        assert.ok(step.options?.includes(step.answer), `${activity.slug} ${level}: answer must be an option`);
        for (const option of step.options) {
          assert.doesNotMatch(option, portugueseChoices, `${activity.slug} ${level}: ${option}`);
        }
      }
    }
  }
  const restaurant = activities.find((activity) => activity.id === 37);
  assert.match(restaurant.steps[0].context, /I'd like something red and cold/i);
  assert.equal(restaurant.steps[0].answer, "Cold tomato juice");
  assert.match(restaurant.steps[2].context, /cold beet juice/i);
});

test("every activity step has audio content and feedback only promises a real hint", () => {
  for (const activity of activities) {
    for (const level of ["A1", "A2", "B1", "B2", "C1", "C2"]) {
      for (const step of activitySteps(activity, level)) {
        assert.ok(activityAudioText(step).trim(), `${activity.slug} ${level}: missing audio`)

        if (!step.answer) {
          continue
        }

        const feedback = incorrectActivityFeedback(step, 0)
        assert.equal(feedback.includes("pista"), Boolean(step.hint), `${activity.slug} ${level}`)
      }
    }
  }

  const contextActivity = activities.find((activity) => activity.id === 19)
  assert.equal(activityAudioText(contextActivity.steps[0]), "We sat on the river bank.")
  assert.match(incorrectActivityFeedback(contextActivity.steps[0], 0), /pista abaixo/)

  const draftActivity = activities.find((activity) => activity.id === 28)
  assert.doesNotMatch(activityAudioText(draftActivity.steps[0]), /Thursday at 2 p\.m\./)
});

test("daily activity is stable in the user's timezone and varies across days", () => {
  assert.equal(localActivityDate("America/Sao_Paulo", new Date("2026-10-01T01:00:00Z")), "2026-09-30");
  const first = dailyActivity(profile, "2026-09-30");
  assert.equal(dailyActivity(profile, "2026-09-30").slug, first.slug);
  const suggestions = new Set(Array.from({ length: 21 }, (_, index) => dailyActivity(profile, `2026-10-${String(index + 1).padStart(2, "0")}`).slug));
  assert.ok(suggestions.size > 3);
});

test("vocabulary challenges use words from the learner's CEFR level and advanced levels add explanation", () => {
  const cards = ["mechanic", "teacher", "pilot", "doctor"].map((word, index) => ({ id: String(index), word, translation: word, definitionEn: `A person who works as a ${word}.`, definitionPt: null, exampleEn: `The ${word} is here.`, examplePt: null, phonetic: null, cefrLevel: "B2", options: [] }));
  const definition = activitySteps(activities[15], "B2", cards);
  assert.equal(definition[0].answer, "mechanic");
  assert.equal(definition.length, 2);
  const cloze = activitySteps(activities[1], "B2", cards);
  assert.match(cloze[0].context, /___/);
  assert.equal(cloze[0].answer, "thick");
  assert.equal(activitySteps(activities[1], "C2", cards)[0].answer, "ambiguous");
  assert.equal(activitySteps(activities[1], "A1", []).length, 1);
  assert.equal(activitySteps(activities[28], "A2", [], 4)[0].answer, "goes");
  assert.equal(normalizeAnswer("She goes to work every day!"), "she goes to work every day");
});
