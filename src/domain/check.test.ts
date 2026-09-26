import { describe, it, expect } from "vitest";
import { checkAnswer } from "./check";
import type { Check } from "./game-spec";

const hints = ["h1", "h2", "h3"];

describe("checkAnswer", () => {
  it("number: accepts within tolerance, rejects outside", () => {
    const c: Check = { id: "k1", kind: "number", concept_ids: ["c_atp"], prompt: "ATP?", hints, answer: 32, tolerance: 2, formula: null };
    expect(checkAnswer(c, 30).correct).toBe(true);
    expect(checkAnswer(c, "33").correct).toBe(true);
    expect(checkAnswer(c, 29).correct).toBe(false);
    expect(checkAnswer(c, "abc").correct).toBe(false);
  });
  it("choice: exact match, returns misconception feedback on wrong", () => {
    const c: Check = { id: "k2", kind: "choice", concept_ids: ["c_etc"], prompt: "?", hints,
      options: ["cyanide", "arsenic"], answer: "cyanide", feedback_by_wrong: { arsenic: "Arsenic acts over hours." } };
    expect(checkAnswer(c, "cyanide").correct).toBe(true);
    expect(checkAnswer(c, "arsenic")).toEqual({ correct: false, feedback: "Arsenic acts over hours." });
  });
  it("order: exact sequence required", () => {
    const c: Check = { id: "k3", kind: "order", concept_ids: ["c_resp"], prompt: "?", hints,
      items: ["Krebs", "Glycolysis", "ETC"], answer: ["Glycolysis", "Krebs", "ETC"] };
    expect(checkAnswer(c, ["Glycolysis", "Krebs", "ETC"]).correct).toBe(true);
    expect(checkAnswer(c, ["Krebs", "Glycolysis", "ETC"]).correct).toBe(false);
  });
  it("set: order-insensitive, exact membership", () => {
    const c: Check = { id: "k4", kind: "set", concept_ids: ["c_x"], prompt: "?", hints,
      options: ["a", "b", "c"], answer: ["a", "c"] };
    expect(checkAnswer(c, ["c", "a"]).correct).toBe(true);
    expect(checkAnswer(c, ["a"]).correct).toBe(false);
    expect(checkAnswer(c, ["a", "b", "c"]).correct).toBe(false);
  });
  it("match: every pair must match", () => {
    const c: Check = { id: "k5", kind: "match", concept_ids: ["c_x"], prompt: "?", hints,
      left: ["enzyme", "substrate"], right: ["catalyst", "reactant"], answer: { enzyme: "catalyst", substrate: "reactant" } };
    expect(checkAnswer(c, { substrate: "reactant", enzyme: "catalyst" }).correct).toBe(true);
    expect(checkAnswer(c, { enzyme: "reactant", substrate: "catalyst" }).correct).toBe(false);
  });
});
