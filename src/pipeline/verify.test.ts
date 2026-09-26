import { describe, it, expect } from "vitest";
import { verifyGame } from "./verify";
import type { ConceptMap } from "@/domain/concept-map";
import type { GameSpec } from "@/domain/game-spec";

const map = { unit: { title: "t", course: "c", level: "AP/IB" }, source_coverage: "x",
  concepts: ["c_a", "c_b", "c_c"].map((id) => ({ id, name: id, summary: "s", kind: "term", facts: ["f"], formulas: [], steps: [], misconceptions: [], relations: [], source_ref: null })) } as ConceptMap;
const hints = ["1", "2", "3"];
const base: GameSpec = { mode: "demo", title: "T", briefing: "b", intro: "i", outro_win: "w", outro_lose: "l",
  concept_ids: ["c_a"], asset_requests: [], content: {},
  checks: [{ id: "k1", kind: "number", concept_ids: ["c_a"], prompt: "p", hints, answer: 6, tolerance: 0, formula: "2*3" }] };

describe("verifyGame", () => {
  it("passes a valid spec", () => {
    expect(verifyGame(base, map)).toEqual({ ok: true, problems: [] });
  });
  it("flags unknown concept ids", () => {
    const bad = { ...base, checks: [{ ...base.checks[0], concept_ids: ["c_zzz"] }] } as GameSpec;
    expect(verifyGame(bad, map).problems.join()).toMatch(/c_zzz/);
  });
  it("flags number answers that don't match their formula", () => {
    const bad = { ...base, checks: [{ ...base.checks[0], answer: 7 }] } as GameSpec;
    expect(verifyGame(bad, map).ok).toBe(false);
  });
  it("flags choice answers missing from options and order answers that aren't a permutation", () => {
    const bad = { ...base, checks: [
      { id: "k2", kind: "choice", concept_ids: ["c_a"], prompt: "p", hints, options: ["x", "y"], answer: "z", feedback_by_wrong: {} },
      { id: "k3", kind: "order", concept_ids: ["c_a"], prompt: "p", hints, items: ["a", "b"], answer: ["a", "c"] },
    ] } as GameSpec;
    const r = verifyGame(bad, map);
    expect(r.problems).toHaveLength(2);
  });
  it("flags duplicate check ids", () => {
    const bad = { ...base, checks: [base.checks[0], base.checks[0]] } as GameSpec;
    expect(verifyGame(bad, map).problems.join()).toMatch(/duplicate/i);
  });
});
