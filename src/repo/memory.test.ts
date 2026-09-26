import { describe, it, expect } from "vitest";
import { createMemoryRepo } from "./memory";

describe("memory repo", () => {
  it("creates, reads, and patches units", async () => {
    const repo = createMemoryRepo();
    const u = await repo.createUnit({ title: "t", course: "c", sources: [] }, null);
    expect(u.status).toBe("queued");
    await repo.updateUnit(u.id, { status: "ready" });
    expect((await repo.getUnit(u.id))?.status).toBe("ready");
    expect(await repo.getUnit("nope")).toBeNull();
  });
  it("creates games linked to units and stores assets", async () => {
    const repo = createMemoryRepo();
    const u = await repo.createUnit({ title: "t", course: "c", sources: [] }, null);
    const g = await repo.createGame(u.id, "demo");
    await repo.updateGame(g.id, { status: "failed", error: "boom" });
    expect(await repo.getGame(g.id)).toMatchObject({ unitId: u.id, mode: "demo", status: "failed", error: "boom" });
    await repo.addAsset({ url: "u", kind: "scene", tags: ["lab"], mood: null, positions: {}, styleVersion: 1 });
    expect(await repo.listAssets()).toHaveLength(1);
  });
});
