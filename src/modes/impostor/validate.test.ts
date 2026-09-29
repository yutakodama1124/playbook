import { describe, it, expect } from "vitest";
import { validateImpostor, impostorChecks } from "./validate";
import { content, map } from "./__fixtures__/impostor";

describe("validateImpostor", () => {
  it("accepts a valid set of rounds", () => expect(validateImpostor(content, map)).toEqual([]));
  it("requires 5 rounds, 9+ distinct true facts, known concepts, and a fake that isn't also listed as true", () => {
    const bad = { rounds: [{ ...content.rounds[0], concept_ids: ["c_zz"], true_facts: ["a", "a", "Fake fact 1"] }] };
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

describe("impostorChecks", () => {
  it("makes one 'which is fake' choice check per round with the fake among 3 true facts", () => {
    const checks = impostorChecks(content);
    expect(checks).toHaveLength(5);
    const c = checks[0];
    expect(c.kind).toBe("choice");
    if (c.kind !== "choice") return;
    expect(c.answer).toBe("Fake fact 1");
    expect(c.options).toHaveLength(4);
    expect(c.options).toContain("Fake fact 1");
    expect(Object.keys(c.feedback_by_wrong)).toHaveLength(3);
  });
});
