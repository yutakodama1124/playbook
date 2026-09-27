import { describe, it, expect } from "vitest";
import { pickAsset, scoreAsset } from "./library";
import type { AssetRow } from "@/repo/types";

const a = (id: string, tags: string[]): AssetRow => ({ id, url: id, kind: "scene", tags, mood: null, positions: {}, styleVersion: 1 });

describe("asset matching", () => {
  it("scores by overlapping tags, case-insensitive", () => {
    expect(scoreAsset(a("1", ["Lab", "dark"]), ["lab", "bright"])).toBe(1);
  });
  it("picks the best match above the threshold", () => {
    const lib = [a("lab", ["lab", "dark", "science"]), a("office", ["office"])];
    expect(pickAsset(lib, ["lab", "science"])?.id).toBe("lab");
  });
  it("returns null when nothing matches well enough", () => {
    expect(pickAsset([a("office", ["office"])], ["spaceship", "bridge"], 1)).toBeNull();
  });
  it("matches on individual words inside multi-word tags", () => {
    expect(scoreAsset(a("1", ["middle-aged man", "chemist"]), ["middle-aged", "chemist"])).toBe(2);
  });
  it("skips excluded urls", () => {
    const lib = [a("lab", ["lab"]), a("lab2", ["lab"])];
    expect(pickAsset(lib, ["lab"], 1, new Set(["lab"]))?.id).toBe("lab2");
  });
});
