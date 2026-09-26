import { describe, it, expect } from "vitest";
import { ConceptMapSchema } from "./concept-map";
import { CheckSchema } from "./game-spec";

const concept = (id: string) => ({ id, name: id, summary: "s", kind: "process", facts: ["f"] });

describe("schemas", () => {
  it("ConceptMap applies defaults and enforces id format", () => {
    const ok = ConceptMapSchema.parse({ unit: { title: "t", course: "AP Bio", level: "AP/IB" },
      concepts: [concept("c_a"), concept("c_b"), concept("c_c")], source_coverage: "x" });
    expect(ok.concepts[0].misconceptions).toEqual([]);
    expect(() => ConceptMapSchema.parse({ unit: { title: "t", course: "c", level: "high" },
      concepts: [concept("Bad Id"), concept("c_b"), concept("c_c")], source_coverage: "x" })).toThrow();
  });
  it("Check requires exactly 3 hints", () => {
    expect(() => CheckSchema.parse({ id: "k", kind: "number", concept_ids: ["c_a"], prompt: "p",
      hints: ["one"], answer: 1, tolerance: 0, formula: null })).toThrow();
  });
});
