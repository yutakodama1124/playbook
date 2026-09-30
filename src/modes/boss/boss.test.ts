import { describe, it, expect, beforeEach } from "vitest";
import { createMemoryRepo } from "@/repo/memory";
import type { Repo } from "@/repo/types";
import { getBoss, recordAnswer } from "./boss";
import { map, spec as caseSpec } from "@/modes/case/__fixtures__/case";

let repo: Repo, unitId: string, gameId: string;
beforeEach(async () => {
  repo = createMemoryRepo();
  const u = await repo.createUnit({ title: "Cellular Respiration", course: "AP Biology", sources: [] }, "2026-10-04");
  await repo.updateUnit(u.id, { status: "ready", conceptMap: map });
  const g = await repo.createGame(u.id, "case");
  await repo.updateGame(g.id, { status: "ready", spec: { ...caseSpec, checks: [{ id: "d1", kind: "choice", concept_ids: ["c_etc"], prompt: "Which stage stops first?", hints: ["1", "2", "3"],
    options: ["Glycolysis", "ETC"], answer: "ETC", feedback_by_wrong: { Glycolysis: "Glycolysis needs no O2." } }] } });
  await repo.addAsset({ url: "boss-bio", kind: "boss", tags: ["cell", "biology", "golem"], mood: null, positions: {}, styleVersion: 1 });
  await repo.addAsset({ url: "boss-phys", kind: "boss", tags: ["physics", "gear"], mood: null, positions: {}, styleVersion: 1 });
  unitId = u.id; gameId = g.id;
});

describe("getBoss", () => {
  it("returns full HP, subject-matched art, and a daily attack built from existing checks without answers", async () => {
    const b = await getBoss(repo, unitId, "dev1", Date.parse("2026-10-01T00:00:00Z"));
    expect(b.boss.hp).toBe(b.boss.maxHp);
    expect(b.art).toBe("boss-bio");
    expect(b.boss.daysLeft).toBe(3);
    expect(b.attack.length).toBeGreaterThan(0);
    expect(b.attack[0]).toMatchObject({ gameId, check: { id: "d1" } });
    expect(JSON.stringify(b.attack)).not.toContain("feedback_by_wrong");
    expect(JSON.stringify(b.attack)).not.toContain('"answer"');
  });
  it("records answers per device and lowers HP", async () => {
    await recordAnswer(repo, { deviceId: "dev1", gameId, conceptIds: ["c_etc"], correct: true });
    const mine = await getBoss(repo, unitId, "dev1", Date.now());
    const other = await getBoss(repo, unitId, "dev2", Date.now());
    expect(mine.boss.hp).toBeLessThan(other.boss.hp);
  });
});
