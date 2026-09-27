import { describe, it, expect, vi } from "vitest";
import { gradeAccusation } from "./accuse";
import { spec } from "./__fixtures__/case";
import type { LlmClient } from "@/lib/llm";

const grader = (covered: number[]): LlmClient => ({ parseStructured: vi.fn().mockResolvedValue({ covered_step_indexes: covered, coaching: "Nice." }) });

describe("gradeAccusation", () => {
  it("marks correct option and which reasoning steps were covered", async () => {
    const r = await gradeAccusation(grader([1]), spec, "o1", "Only an ETC blocker kills ATP that fast.");
    expect(r.correct).toBe(true);
    expect(r.steps.map((s) => s.covered)).toEqual([false, true]);
    expect(r.solution.summary).toContain("Dana");
    expect(r.feedback).toBeNull();
  });
  it("returns misconception feedback for a wrong option", async () => {
    const r = await gradeAccusation(grader([]), spec, "o2", "The chef bought yeast.");
    expect(r.correct).toBe(false);
    expect(r.feedback).toBe("Fermentation clue misread.");
  });
  it("ignores out-of-range step indexes and rejects unknown options", async () => {
    const r = await gradeAccusation(grader([0, 7, -1]), spec, "o1", "x");
    expect(r.steps.map((s) => s.covered)).toEqual([true, false]);
    await expect(gradeAccusation(grader([]), spec, "zz", "x")).rejects.toThrow(/option/);
  });
});
