import assert from "node:assert/strict";
import test from "node:test";
import { onboardingSchema } from "../src/features/Onboarding/Model/index.ts";

const valid = { level: "A1", reason: "Conversação", targetMinutes: "20", timezone: "America/Sao_Paulo" };

test("accepts a valid initial goal and normalizes minutes", () => {
  const result = onboardingSchema.parse(valid);
  assert.equal(result.targetMinutes, 20);
});

test("rejects invalid levels, goals and timezones", () => {
  assert.equal(onboardingSchema.safeParse({ ...valid, level: "C3" }).success, false);
  assert.equal(onboardingSchema.safeParse({ ...valid, targetMinutes: "500" }).success, false);
  assert.equal(onboardingSchema.safeParse({ ...valid, timezone: "invalid/timezone" }).success, false);
});
