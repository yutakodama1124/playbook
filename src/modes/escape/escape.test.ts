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

describe("readability limits", () => {
  const words = (n: number) => Array.from({ length: n }, (_, i) => `w${i}`).join(" ");
  it("accepts text right at the limits", () => {
    const ok = { ...spec, checks: spec.checks.map((k) => ({ ...k, prompt: words(40) })),
      content: { ...content, premise: words(60), rooms: content.rooms.map((r) => ({ ...r, description: words(40),
        hotspots: r.hotspots.map((h) => ({ ...h, description: words(45), reveals_clue: h.reveals_clue ? words(15) : "" })) })) } };
    expect(validateEscape(ok, map)).toEqual([]);
  });
  it("flags wordy premise, room description, hotspot description, fragment, and check prompt", () => {
    const bad = { ...spec, checks: spec.checks.map((k) => (k.id === "k2" ? { ...k, prompt: words(41) } : k)),
      content: { ...content, premise: words(61), rooms: content.rooms.map((r) => (r.id === "r1" ? { ...r, description: words(41),
        hotspots: r.hotspots.map((h) => (h.id === "h1" ? { ...h, description: words(46), reveals_clue: words(16) } : h)) } : r)) } };
    const p = validateEscape(bad, map).join("|");
    expect(p).toMatch(/premise is too long \(61 words, max 60\)/);
    expect(p).toMatch(/room r1 description is too long \(41 words, max 40\)/);
    expect(p).toMatch(/hotspot h1 description is too long \(46 words, max 45\)/);
    expect(p).toMatch(/hotspot h1 fragment \(reveals_clue\) is too long \(16 words, max 15\)/);
    expect(p).toMatch(/check k2 prompt is too long \(41 words, max 40\)/);
  });
});
