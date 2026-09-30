import { describe, it, expect, vi } from "vitest";
import { createReviewer } from "./review";
import type { LlmClient } from "@/lib/llm";
import { spec, map } from "@/modes/case/__fixtures__/case";

const llmReturns = (out: object): LlmClient => ({ parseStructured: vi.fn().mockResolvedValue(out) });

describe("createReviewer", () => {
  it("returns blocker and major problems, ignores minor ones", async () => {
    const review = createReviewer(llmReturns({ problems: [
      { severity: "blocker", where: "check d1", issue: "two options are correct", fix: "reword option B" },
      { severity: "major", where: "evidence e3", issue: "contradicts the timeline", fix: "change time to 18:00" },
      { severity: "minor", where: "title", issue: "a bit bland", fix: "" },
    ], answers_verified: true }));
    const problems = await review(spec, map);
    expect(problems).toHaveLength(2);
    expect(problems[0]).toMatch(/check d1.*two options are correct.*reword option B/);
  });
  it("sends the full spec and the concept map, and demands independent answer derivation", async () => {
    const llm = llmReturns({ problems: [], answers_verified: true });
    await createReviewer(llm)(spec, map);
    const args = (llm.parseStructured as ReturnType<typeof vi.fn>).mock.calls[0][0];
    const text = JSON.stringify(args.content);
    expect(text).toContain("SOLUTION TEXT"); // reviewer sees the solution
    expect(args.system).toMatch(/derive/i);
    expect(args.system).toMatch(/guess/i);
  });
});
