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

describe("meta-puzzle finale", () => {
  it("requires exactly one exit lock, in the last room", () => {
    const noExit = { ...spec, content: { ...content, rooms: content.rooms.map((r) => ({ ...r, hotspots: r.hotspots.map((h) => ({ ...h, is_exit: false })) })) } };
    expect(validateEscape(noExit, map).join()).toMatch(/exactly 1 exit lock/);
  });
  it("requires every other lock to reveal a fragment for the finale", () => {
    const bad = { ...spec, content: { ...content, rooms: content.rooms.map((r) => ({ ...r, hotspots: r.hotspots.map((h) => (h.id === "h2" ? { ...h, reveals_clue: "" } : h)) })) } };
    expect(validateEscape(bad, map).join()).toMatch(/h2 .*fragment/);
  });
});

describe("layout", () => {
  it("requires distinct zones within a room so markers don't overlap", () => {
    const bad = { ...spec, content: { ...content, rooms: content.rooms.map((r) => ({ ...r, hotspots: r.hotspots.map((h) => ({ ...h, zone: "center" as const })) })) } };
    expect(validateEscape(bad, map).join()).toMatch(/room r1.*zone/);
  });
});

describe("clue objects", () => {
  it("requires at least one clue object per room", () => {
    const bad = { ...spec, content: { ...content, rooms: content.rooms.map((r) => ({ ...r, hotspots: r.hotspots.map((h) => ({ ...h, lock_check_id: h.lock_check_id || "k1" })) })) } };
    expect(validateEscape(bad, map).join()).toMatch(/room r1 needs at least 1 clue object/);
  });
});

describe("redactEscape / clueFor", () => {
  it("hides clues until solved and returns the clue for a solved lock", () => {
    const json = JSON.stringify(redactEscape(content));
    expect(json).not.toContain("SECRET CLUE");
    expect(json).toContain("Look at h1");
    expect(clueFor(spec, "k1")).toBe("SECRET CLUE ONE");
    expect(clueFor(spec, "k4")).toBeNull(); // the exit lock ends the game; it reveals nothing
  });
});

describe("escapeAssetRequests", () => {
  it("requests one scene per room", () => {
    expect(escapeAssetRequests(content)).toEqual([{ role: "scene:r1", tags: ["lab"] }, { role: "scene:r2", tags: ["vault"] }]);
  });
});
