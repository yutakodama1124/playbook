import { describe, it, expect } from "vitest";
import { toPublicSpec } from "./public-spec";
import { spec } from "@/modes/case/__fixtures__/case";

describe("toPublicSpec", () => {
  it("strips check answers and case secrets", () => {
    const pub = toPublicSpec(spec);
    const json = JSON.stringify(pub);
    for (const leak of ["SECRET", "ALIBI", "KNOWS", "correct_option_id", "solution", "Dana used", "feedback_by_wrong", "wrong_option_feedback", "speaking_style"])
      expect(json).not.toContain(leak);
    expect(pub.checks[0]).toEqual({ id: "d1", kind: "choice", concept_ids: ["c_etc"], prompt: "Which stage stops first?", hints: ["1", "2", "3"], options: ["Glycolysis", "ETC"] });
    expect(json).toContain("Dr. Vale");
    expect(json).toContain("Tox report");
  });
});
