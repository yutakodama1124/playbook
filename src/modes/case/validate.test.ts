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
  it("rejects a mentor as an option, duplicate evidence ids, rows without evidence, and catch-all clues", () => {
    const bad = { ...content,
      accusation: { ...content.accusation, options: [...content.accusation.options, { id: "o4", label: "Dr. Vale", character_id: "m1" }],
        wrong_option_feedback: [...content.accusation.wrong_option_feedback, { option_id: "o4", feedback: "x" }] },
      evidence: [...content.evidence, { ...content.evidence[0] }],
      board: content.board.map((r, i) => (i === 0 ? { ...r, evidence_ids: [] } : r)) };
    const p = validateCase(bad, map, spec.checks).join("|");
    expect(p).toMatch(/mentor .* option/);
    expect(p).toMatch(/duplicate evidence id e1/);
    expect(p).toMatch(/board row b1 .* evidence/);
    const catchAll = { ...content, evidence: content.evidence.map((e) => ({ ...e, points_to: ["o1", "o2", "o3"] })) };
    expect(validateCase(catchAll, map, spec.checks).join()).toMatch(/correct option needs at least 3/);
  });
  it("requires each discovered evidence item to be needed by some board row", () => {
    const bad = { ...content, board: content.board.map((r) => ({ ...r, evidence_ids: r.evidence_ids.filter((id) => id !== "e5") || ["e1"] })) };
    const fixed = { ...bad, board: bad.board.map((r) => (r.evidence_ids.length ? r : { ...r, evidence_ids: ["e1"] })) };
    expect(validateCase(fixed, map, spec.checks).join()).toMatch(/e5 .*not needed by any board row/);
  });
});
