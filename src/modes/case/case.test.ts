import { describe, it, expect } from "vitest";
import { validateCase } from "./validate";
import { press, present, verdict, startingEvidence } from "./trial";
import { redactCase } from "./redact";
import { content, map, spec } from "./__fixtures__/case";

describe("validateCase (trial format)", () => {
  it("accepts a valid case", () => expect(validateCase(content, map)).toEqual([]));
  it("requires a real contradiction per testimony and evidence the player already has", () => {
    const t = content.testimonies[0];
    const bad = { ...content, testimonies: [{ ...t, statements: t.statements.map((x) => ({ ...x, press_unlocks_evidence_id: "" })), contradiction: { ...t.contradiction, statement_id: "zz", evidence_id: "e3" } }] };
    const p = validateCase(bad, map).join("|");
    expect(p).toMatch(/2–4 testimonies/);
    expect(p).toMatch(/t1.*statement zz/);
    expect(p).toMatch(/t1.*e3.*not available yet/);
  });
  it("enforces short, readable text", () => {
    const bad = { ...content, testimonies: content.testimonies.map((t) => ({ ...t, statements: t.statements.map((s, i) => (i === 0 ? { ...s, text: "word ".repeat(40) } : s)) })) };
    expect(validateCase(bad, map).join()).toMatch(/too long/);
  });
  it("checks the finale: proof evidence, feedback for wrong options, no mentor option", () => {
    const bad = { ...content, finale: { ...content.finale, proof_evidence_id: "nope", wrong_option_feedback: [], options: [...content.finale.options, { id: "o4", label: "Dr. Vale", character_id: "m1" }] } };
    const p = validateCase(bad, map).join("|");
    expect(p).toMatch(/proof evidence/);
    expect(p).toMatch(/feedback for o2/);
    expect(p).toMatch(/mentor/);
  });
});

describe("trial play", () => {
  it("starts with only in-file evidence", () => expect(startingEvidence(content).map((e) => e.id)).toEqual(["e1", "e2"]));
  it("press returns the reply and any evidence it unlocks", () => {
    expect(press(spec, "t1", "s3")).toMatchObject({ reply: "More about s3.", unlocked: [{ id: "e3" }] });
    expect(press(spec, "t1", "s1").unlocked).toEqual([]);
  });
  it("present is correct only for the right statement + evidence", () => {
    expect(present(spec, "t1", "s2", "e2")).toMatchObject({ correct: true, breakthrough: expect.stringContaining("panicked") });
    expect(present(spec, "t1", "s2", "e1").correct).toBe(false);
    expect(present(spec, "t1", "s1", "e2").correct).toBe(false);
  });
  it("catching a lie hands over evidence from skipped presses (no soft-lock)", () => {
    const r = present(spec, "t1", "s2", "e2");
    expect(r.correct && r.unlocked.map((e) => e.id)).toEqual(["e3"]);
  });
  it("verdict needs the right answer and the right proof", () => {
    expect(verdict(spec, "o1", "e1")).toMatchObject({ correct: true, proofCorrect: true });
    expect(verdict(spec, "o1", "e2")).toMatchObject({ correct: true, proofCorrect: false });
    expect(verdict(spec, "o2", "e1")).toMatchObject({ correct: false, feedback: "Omar's yeast acts slowly." });
  });
  it("throws on unknown ids", () => expect(() => press(spec, "t9", "s1")).toThrow());
});

describe("redactCase", () => {
  it("hides contradictions, press replies, locked evidence, and the solution", () => {
    const json = JSON.stringify(redactCase(content));
    for (const leak of ["SECRET UNLOCK", "SOLUTION TEXT", "panicked", "More about", "correct_option_id", "proof_evidence_id", "contradiction"]) expect(json).not.toContain(leak);
    expect(json).toContain("Tox report");
    expect(json).toContain("I watered at midnight.");
  });
});
