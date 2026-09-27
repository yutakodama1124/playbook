import { describe, it, expect } from "vitest";
import { fromLlmCheck, type LlmCheck } from "./llm-check";

const base: LlmCheck = { id: "k", kind: "number", concept_ids: ["c_a"], prompt: "p", hints: ["1", "2", "3"],
  answer_number: null, tolerance: null, formula: null, options: [], answer: [], pairs: [], wrong_feedback: [] };

describe("fromLlmCheck", () => {
  it("converts number checks", () => {
    expect(fromLlmCheck({ ...base, answer_number: 6, tolerance: 0.5, formula: "2*3" }))
      .toMatchObject({ kind: "number", answer: 6, tolerance: 0.5, formula: "2*3" });
  });
  it("converts choice checks with feedback list to a record", () => {
    const c = fromLlmCheck({ ...base, kind: "choice", options: ["a", "b"], answer: ["a"], wrong_feedback: [{ option: "b", feedback: "no" }] });
    expect(c).toMatchObject({ kind: "choice", answer: "a", feedback_by_wrong: { b: "no" } });
  });
  it("converts order, set, and match checks", () => {
    expect(fromLlmCheck({ ...base, kind: "order", options: ["y", "x"], answer: ["x", "y"] })).toMatchObject({ kind: "order", items: ["y", "x"], answer: ["x", "y"] });
    expect(fromLlmCheck({ ...base, kind: "set", options: ["x", "y"], answer: ["y"] })).toMatchObject({ kind: "set", answer: ["y"] });
    expect(fromLlmCheck({ ...base, kind: "match", pairs: [{ left: "l1", right: "r1" }, { left: "l2", right: "r2" }] }))
      .toMatchObject({ kind: "match", left: ["l1", "l2"], right: ["r1", "r2"], answer: { l1: "r1", l2: "r2" } });
  });
  it("normalizes hints to exactly 3", () => {
    expect(fromLlmCheck({ ...base, answer_number: 1, tolerance: 0, hints: ["a", "b", "c", "d"] }).hints).toEqual(["a", "b", "c"]);
    expect(fromLlmCheck({ ...base, answer_number: 1, tolerance: 0, hints: ["a"] }).hints).toHaveLength(3);
  });
  it("throws a clear error for a number check without an answer", () => {
    expect(() => fromLlmCheck(base)).toThrow(/check k/);
  });
});
