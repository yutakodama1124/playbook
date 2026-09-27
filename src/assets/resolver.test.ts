import { describe, it, expect, vi } from "vitest";
import { createAssetResolver } from "./resolver";
import { createMemoryRepo } from "@/repo/memory";
import type { GameSpec } from "@/domain/game-spec";
import type { LlmClient } from "@/lib/llm";

describe("createAssetResolver", () => {
  it("fills every portrait from the library without reuse, even when tags don't match", async () => {
    const repo = createMemoryRepo();
    for (const [i, t] of [["pharmacist", "woman"], ["chef"], ["farmer"]].entries())
      await repo.addAsset({ url: `u${i}`, kind: "portrait", tags: t, mood: null, positions: {}, styleVersion: 1 });
    await repo.addAsset({ url: "lab", kind: "scene", tags: ["lab", "chemistry", "night"], mood: null, positions: {}, styleVersion: 1 });
    const upload = vi.fn();
    const resolve = createAssetResolver({ repo, llm: {} as LlmClient, upload });
    const spec = { asset_requests: [
      { role: "scene", tags: ["chemistry", "lab"] },
      { role: "portrait:a", tags: ["pharmacist"] }, { role: "portrait:b", tags: ["astronaut"] }, { role: "portrait:c", tags: ["pilot"] },
    ] } as unknown as GameSpec;
    const out = await resolve(spec);
    expect(out.scene).toBe("lab");
    expect(out["portrait:a"]).toBe("u0");
    expect(new Set([out["portrait:a"], out["portrait:b"], out["portrait:c"]]).size).toBe(3);
    expect(upload).not.toHaveBeenCalled();
  });
});
