import { describe, it, expect } from "vitest";
import { toPublicSpec } from "./public-spec";
import { spec } from "@/modes/case/__fixtures__/case";
import { content as impostorContent } from "@/modes/impostor/__fixtures__/impostor";

describe("toPublicSpec", () => {
  it("strips check answers and case secrets", () => {
    const pub = toPublicSpec(spec);
    const json = JSON.stringify(pub);
    for (const leak of ["SECRET", "ALIBI", "KNOWS", "correct_option_id", "solution", "Dana used", "feedback_by_wrong", "wrong_option_feedback", "speaking_style"])
      expect(json).not.toContain(leak);
    expect(pub.checks[0]).toEqual({ id: "d1", kind: "choice", concept_ids: ["c_etc"], prompt: "Which stage stops first?", hints: ["1", "2", "3"], options: ["Glycolysis", "ETC"] });
    expect(json).toContain("Dr. Vale");
    expect(json).toContain("Tox report");
    expect(json).toContain("who had the pharmacy key"); // locked evidence appears only as a lead
    expect(json).not.toContain("Dana signed out the key");
  });
  it("hides impostor facts", () => {
    const pub = toPublicSpec({ ...spec, mode: "impostor", content: impostorContent, checks: [] });
    const json = JSON.stringify(pub);
    expect(json).toContain("Topic 1");
    expect(json).not.toContain("Fake fact");
    expect(json).not.toContain("True fact");
  });
});
