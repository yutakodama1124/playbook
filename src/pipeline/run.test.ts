import { describe, it, expect, vi } from "vitest";
import { runUnitPipeline, runGamePipeline } from "./run";
import { createMemoryRepo } from "@/repo/memory";
import { ParseError, type LlmClient } from "@/lib/llm";

const concept = (id: string) => ({ id, name: id, summary: "s", kind: "term", facts: ["f"], formulas: [], steps: [], misconceptions: [], relations: [], source_ref: null });
const map = { unit: { title: "t", course: "c", level: "AP/IB" }, source_coverage: "x", concepts: [concept("c_a"), concept("c_b"), concept("c_c")] };
const spec = { mode: "demo", title: "T", briefing: "b", intro: "i", outro_win: "w", outro_lose: "l", concept_ids: ["c_a"],
  asset_requests: [{ role: "scene", tags: ["lab"] }], content: { theme: "lab" },
  checks: [{ id: "k1", kind: "number", concept_ids: ["c_a"], prompt: "p", hints: ["1", "2", "3"], answer_number: 6, tolerance: 0, formula: "2*3",
    options: [], answer: [], pairs: [], wrong_feedback: [] }] };

describe("runUnitPipeline", () => {
  it("marks the unit ready with its concept map", async () => {
    const repo = createMemoryRepo();
    const llm: LlmClient = { parseStructured: vi.fn().mockResolvedValue(map) };
    const u = await repo.createUnit({ title: "t", course: "c", sources: [] }, null);
    await runUnitPipeline({ llm, repo }, u.id);
    expect(await repo.getUnit(u.id)).toMatchObject({ status: "ready", conceptMap: map });
  });
  it("records failures", async () => {
    const repo = createMemoryRepo();
    const llm: LlmClient = { parseStructured: vi.fn().mockRejectedValue(new Error("down")) };
    const u = await repo.createUnit({ title: "t", course: "c", sources: [] }, null);
    await runUnitPipeline({ llm, repo }, u.id);
    expect(await repo.getUnit(u.id)).toMatchObject({ status: "failed", error: "down" });
  });
});

describe("runGamePipeline", () => {
  it("generates, verifies, resolves assets, and publishes", async () => {
    const repo = createMemoryRepo();
    const u = await repo.createUnit({ title: "t", course: "c", sources: [] }, null);
    await repo.updateUnit(u.id, { status: "ready", conceptMap: map as never });
    const g = await repo.createGame(u.id, "demo");
    const llm: LlmClient = { parseStructured: vi.fn().mockResolvedValue(spec) };
    const resolveAssets = vi.fn().mockResolvedValue({ scene: "https://img/lab.png" });
    await runGamePipeline({ llm, repo, resolveAssets }, g.id);
    expect(await repo.getGame(g.id)).toMatchObject({ status: "ready", assets: { scene: "https://img/lab.png" }, verifierReport: { ok: true } });
  });
  it("retries generation once with verifier problems, then fails", async () => {
    const repo = createMemoryRepo();
    const u = await repo.createUnit({ title: "t", course: "c", sources: [] }, null);
    await repo.updateUnit(u.id, { status: "ready", conceptMap: map as never });
    const g = await repo.createGame(u.id, "demo");
    const bad = { ...spec, checks: [{ ...spec.checks[0], answer_number: 7 }] };
    const llm: LlmClient = { parseStructured: vi.fn().mockResolvedValue(bad) };
    await runGamePipeline({ llm, repo, resolveAssets: vi.fn() }, g.id);
    expect(llm.parseStructured).toHaveBeenCalledTimes(3); // 1 + 2 repair rounds
    expect((await repo.getGame(g.id))?.status).toBe("failed");
  });
  it("treats unconvertible checks as repairable problems", async () => {
    const repo = createMemoryRepo();
    const u = await repo.createUnit({ title: "t", course: "c", sources: [] }, null);
    await repo.updateUnit(u.id, { status: "ready", conceptMap: map as never });
    const g = await repo.createGame(u.id, "demo");
    const broken = { ...spec, checks: [{ ...spec.checks[0], answer_number: null }] };
    const llm: LlmClient = { parseStructured: vi.fn().mockResolvedValueOnce(broken).mockResolvedValue(spec) };
    await runGamePipeline({ llm, repo, resolveAssets: vi.fn().mockResolvedValue({}) }, g.id);
    expect(llm.parseStructured).toHaveBeenCalledTimes(2);
    expect((await repo.getGame(g.id))?.status).toBe("ready");
  });
  it("treats schema parse errors as repairable", async () => {
    const repo = createMemoryRepo();
    const u = await repo.createUnit({ title: "t", course: "c", sources: [] }, null);
    await repo.updateUnit(u.id, { status: "ready", conceptMap: map as never });
    const g = await repo.createGame(u.id, "demo");
    const llm: LlmClient = { parseStructured: vi.fn().mockRejectedValueOnce(new ParseError("bad json")).mockResolvedValue(spec) };
    await runGamePipeline({ llm, repo, resolveAssets: vi.fn().mockResolvedValue({}) }, g.id);
    expect((await repo.getGame(g.id))?.status).toBe("ready");
  });
});
