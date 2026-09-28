import { describe, it, expect } from "vitest";
import { validateEscape, redactEscape, clueFor, escapeAssetRequests } from "./logic";
import { content, map, spec } from "./__fixtures__/escape";

describe("validateEscape", () => {
  it("accepts a valid escape room", () => expect(validateEscape(spec, map)).toEqual([]));
  it("requires 2 rooms, 3+ hotspots, 2+ locks per room, locks pointing at real checks used once", () => {
    const bad = { ...spec, checks: spec.checks.slice(0, 3),
      content: { ...content, rooms: [{ ...content.rooms[0], hotspots: [content.rooms[0].hotspots[0], { ...content.rooms[0].hotspots[1], lock_check_id: "k1" }] }] } };
    const p = validateEscape(bad, map).join("|");
    expect(p).toMatch(/2 rooms/);
    expect(p).toMatch(/3 hotspots/);
    expect(p).toMatch(/k1.*more than one/);
    expect(p).toMatch(/k3.*not used/);
  });
});

describe("redactEscape / clueFor", () => {
  it("hides clues until solved and returns the clue for a solved lock", () => {
    const json = JSON.stringify(redactEscape(content));
    expect(json).not.toContain("SECRET CLUE");
    expect(json).toContain("Look at h1");
    expect(clueFor(spec, "k1")).toBe("SECRET CLUE ONE");
    expect(clueFor(spec, "k2")).toBeNull();
  });
});

describe("escapeAssetRequests", () => {
  it("requests one scene per room", () => {
    expect(escapeAssetRequests(content)).toEqual([{ role: "scene:r1", tags: ["lab"] }, { role: "scene:r2", tags: ["vault"] }]);
  });
});
