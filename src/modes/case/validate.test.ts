import { describe, it, expect } from "vitest";
import { validateCase } from "./validate";
import { content, map, spec } from "./__fixtures__/case";

describe("validateCase", () => {
  it("accepts a valid case", () => {
    expect(validateCase(content, map, spec.checks)).toEqual([]);
  });
  it("requires exactly one mentor and at least 3 non-mentor characters", () => {
    const noMentor = { ...content, characters: content.characters.map((c) => ({ ...c, is_mentor: false })) };
    expect(validateCase(noMentor, map, spec.checks).join()).toMatch(/mentor/);
    const few = { ...content, characters: content.characters.slice(2) };
    expect(validateCase(few, map, spec.checks).join()).toMatch(/at least 3/);
  });
  it("requires the correct option to exist and wrong-option feedback for every other option", () => {
    const bad = { ...content, accusation: { ...content.accusation, correct_option_id: "zz", wrong_option_feedback: [] } };
    const p = validateCase(bad, map, spec.checks).join("|");
    expect(p).toMatch(/correct_option_id/);
    expect(p).toMatch(/feedback/);
  });
  it("flags unknown concept ids and dangling references", () => {
    const bad = { ...content,
      solution: { ...content.solution, chain: [{ step: "x", concept_id: "c_nope" }] },
      evidence: [{ ...content.evidence[0], points_to: ["ghost"] }] };
    const p = validateCase(bad, map, spec.checks).join("|");
    expect(p).toMatch(/c_nope/);
    expect(p).toMatch(/ghost/);
  });
  it("requires 2+ evidence items supporting the correct answer and 1+ making each wrong option tempting", () => {
    const bad = { ...content, evidence: content.evidence.map((e) => ({ ...e, points_to: [] })) };
    const p = validateCase(bad, map, spec.checks).join("|");
    expect(p).toMatch(/correct option .* at least 3/);
    expect(p).toMatch(/wrong option o2 .* no evidence/);
  });
  it("requires a 3-5 row board using choice/number checks exactly once each", () => {
    const bad = { ...content, board: [{ ...content.board[0] }, { ...content.board[1], check_id: "d1" }] };
    const p = validateCase(bad, map, spec.checks).join("|");
    expect(p).toMatch(/board needs 3/);
    expect(p).toMatch(/d1 .*more than one board row/);
  });
  it("requires 2+ evidence at the start, 2+ discoverable, and unlocks only by non-mentor characters", () => {
    const bad = { ...content, evidence: content.evidence.map((e) => ({ ...e, unlocked_by: e.unlocked_by ? "m1" : "" })) };
    expect(validateCase(bad, map, spec.checks).join()).toMatch(/mentor/);
    const noneLocked = { ...content, evidence: content.evidence.map((e) => ({ ...e, unlocked_by: "", unlock_topic: "" })) };
    expect(validateCase(noneLocked, map, spec.checks).join()).toMatch(/at least 2 evidence items discovered/);
  });
});
