import { describe, it, expect } from "vitest";
import { toPublicSpec } from "./public-spec";
import { spec } from "@/modes/case/__fixtures__/case";
import { content as impostorContent } from "@/modes/impostor/__fixtures__/impostor";

describe("toPublicSpec", () => {
  it("strips case secrets: contradictions, press replies, locked evidence, and the verdict", () => {
    const json = JSON.stringify(toPublicSpec(spec));
    for (const leak of ["SECRET UNLOCK", "SOLUTION TEXT", "correct_option_id", "proof_evidence_id", "contradiction", "press_reply", "breakthrough", "wrong_option_feedback", "I panicked"])
      expect(json).not.toContain(leak);
    expect(json).toContain("Dr. Vale");
    expect(json).toContain("statements");
  });
  it("hides impostor facts", () => {
    const pub = toPublicSpec({ ...spec, mode: "impostor", content: impostorContent, checks: [] });
    const json = JSON.stringify(pub);
    expect(json).toContain("Topic 1");
    expect(json).not.toContain("Fake fact");
    expect(json).not.toContain("True fact");
  });
  it("shuffles options stably, and never shows an order puzzle already solved", () => {
    const order = { id: "o1", kind: "order" as const, concept_ids: ["c_etc"], prompt: "p", hints: ["1", "2", "3"], items: ["A", "B", "C", "D"], answer: ["A", "B", "C", "D"] };
    const choice = { id: "q1", kind: "choice" as const, concept_ids: ["c_etc"], prompt: "p", hints: ["1", "2", "3"], options: ["Right", "W1", "W2", "W3"], answer: "Right", feedback_by_wrong: { W1: "", W2: "", W3: "" } };
    const a = toPublicSpec({ ...spec, checks: [order, choice] });
    const b = toPublicSpec({ ...spec, checks: [order, choice] });
    expect(a.checks[0].items).not.toEqual(["A", "B", "C", "D"]);
    expect([...a.checks[0].items!].sort()).toEqual(["A", "B", "C", "D"]);
    expect(a.checks[1].options).toEqual(b.checks[1].options); // stable between requests
    expect([...a.checks[1].options!].sort()).toEqual(["Right", "W1", "W2", "W3"]);
  });
});
