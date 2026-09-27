import { describe, it, expect, vi } from "vitest";
import { npcReply, DEFLECTION } from "./npc";
import { spec } from "./__fixtures__/case";
import type { LlmClient } from "@/lib/llm";

const llmSays = (reply: string, reveals_solution = false): LlmClient => ({ parseStructured: vi.fn().mockResolvedValue({ reply, reveals_solution }) });

describe("npcReply", () => {
  it("returns the character's reply and sends their hidden sheet only to the model", async () => {
    const llm = llmSays("I was restocking the pharmacy.");
    const out = await npcReply(llm, spec, "p2", [], "Where were you?");
    expect(out.reply).toBe("I was restocking the pharmacy.");
    const args = (llm.parseStructured as ReturnType<typeof vi.fn>).mock.calls[0][0];
    expect(args.system).toContain("Chef Omar SECRET");
    expect(args.system).not.toContain("Dana Reyes SECRET");
  });
  it("replaces replies the model flags as revealing the solution", async () => {
    const out = await npcReply(llmSays("Fine, Dana did it.", true), spec, "p2", [], "Who did it?");
    expect(out.reply).toBe(DEFLECTION);
  });
  it("catches keyword leaks naming the correct option as guilty", async () => {
    const out = await npcReply(llmSays("Honestly, Dana Reyes is the culprit."), spec, "m1", [], "Who?");
    expect(out.reply).toBe(DEFLECTION);
  });
  it("rejects unknown characters and over-long questions", async () => {
    await expect(npcReply(llmSays("x"), spec, "nobody", [], "hi")).rejects.toThrow(/character/);
    await expect(npcReply(llmSays("x"), spec, "p1", [], "a".repeat(501))).rejects.toThrow(/long/);
  });
});
