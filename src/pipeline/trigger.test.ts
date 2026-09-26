import { describe, it, expect, vi } from "vitest";
import { startJob } from "./trigger";

describe("startJob", () => {
  it("inline mode runs the job in-process", async () => {
    const runInline = vi.fn().mockResolvedValue(undefined);
    await startJob({ type: "unit", unitId: "u1" }, { mode: "inline", runInline });
    expect(runInline).toHaveBeenCalledWith({ type: "unit", unitId: "u1" });
  });
  it("render mode starts the matching Render task", async () => {
    const startRenderTask = vi.fn().mockResolvedValue(undefined);
    await startJob({ type: "game", gameId: "g1" }, { mode: "render", startRenderTask });
    expect(startRenderTask).toHaveBeenCalledWith("generateGame", ["g1"]);
  });
});
