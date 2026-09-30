import { describe, it, expect } from "vitest";
import { validateImpostor, impostorChecks } from "./validate";
import { content, map } from "./__fixtures__/impostor";

describe("validateImpostor", () => {
  it("accepts a valid set of rounds", () => expect(validateImpostor(content, map)).toEqual([]));
  it("requires 5 rounds, 9+ distinct true facts, known concepts, and a fake that isn't also listed as true", () => {
    const bad = { rounds: [{ ...content.rounds[0], concept_ids: ["c_zz"], true_facts: ["a", "a", "Fake fact 1.x"] }] };
    const p = validateImpostor(bad, map).join("|");
    expect(p).toMatch(/5 rounds/);
    expect(p).toMatch(/9 distinct/);
    expect(p).toMatch(/c_zz/);
    expect(p).toMatch(/corrupted fact also appears/);
  });
});

describe("fake-fact length tell", () => {
  it("flags a corrupted fact much shorter or longer than the true facts", () => {
    const r = content.rounds[0];
    const bad = { rounds: content.rounds.map((x, i) => (i === 0 ? { ...r, true_facts: r.true_facts.map((f) => `${f} with plenty of extra specific detail about the process`), corrupted_fact: "Wrong." } : x)) };
    expect(validateImpostor(bad, map).join()).toMatch(/round 1: corrupted fact length/);
  });
});

describe("fake-fact quality", () => {
  it("rejects a fake identical to its correction, missing concept ids, or a fake that is the longest card", () => {
    const r = content.rounds[0];
    const fake = `${r.true_facts[0]} and more`;
    const bad = { rounds: content.rounds.map((x, i) => (i === 0 ? { ...r, concept_ids: [], correct_version: fake, corrupted_fact: fake } : x)) };
    const p = validateImpostor(bad, map).join("|");
    expect(p).toMatch(/round 1 needs concept_ids/);
    expect(p).toMatch(/round 1: correct_version must differ/);
    expect(p).toMatch(/round 1: corrupted fact is the longest/);
  });
});

describe("impostorChecks", () => {
  it("makes one 'which is fake' choice check per round with the fake among 3 true facts", () => {
    const checks = impostorChecks(content);
    expect(checks).toHaveLength(5);
    const c = checks[0];
    expect(c.kind).toBe("choice");
    if (c.kind !== "choice") return;
    expect(c.answer).toBe("Fake fact 1.x");
    expect(c.options).toHaveLength(4);
    expect(c.options).toContain("Fake fact 1.x");
    expect(Object.keys(c.feedback_by_wrong)).toHaveLength(3);
  });
});

describe("readability limits", () => {
  const words = (n: number) => Array.from({ length: n }, (_, i) => `w${i}`).join(" ");
  it("flags true facts, fakes, and explanations that are too wordy", () => {
    const r = content.rounds[1];
    const bad = { rounds: content.rounds.map((x, i) => (i === 1 ? { ...r, true_facts: [...r.true_facts.slice(1), `long ${words(25)}`], corrupted_fact: `fake ${words(25)}`, explanation: words(41) } : x)) };
    const p = validateImpostor(bad, map).join("|");
    expect(p).toMatch(/round 2: true fact 9 is too long \(26 words, max 25\)/);
    expect(p).toMatch(/round 2: corrupted fact is too long \(26 words, max 25\)/);
    expect(p).toMatch(/round 2: explanation is too long \(41 words, max 40\)/);
  });
  it("allows text right at the limits", () => {
    const r = content.rounds[1];
    const ok = { rounds: content.rounds.map((x, i) => (i === 1 ? { ...r, explanation: words(40) } : x)) };
    expect(validateImpostor(ok, map)).toEqual([]);
  });
});
