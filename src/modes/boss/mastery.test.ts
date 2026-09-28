import { describe, it, expect } from "vitest";
import { conceptStates, bossState, dueConcepts, type MasteryEvent } from "./mastery";
import { map } from "@/modes/case/__fixtures__/case";

const day = 86_400_000;
const T0 = Date.parse("2026-10-01T00:00:00Z");
const ev = (concept: string, correct: boolean, t: number): MasteryEvent => ({ conceptIds: [concept], correct, at: t });

describe("conceptStates", () => {
  it("starts unseen at 0, rises with correct answers, drops with wrong ones", () => {
    const s = conceptStates(map, [ev("c_etc", true, T0), ev("c_etc", true, T0 + 1), ev("c_atp", false, T0)]);
    const etc = s.find((x) => x.id === "c_etc")!, atp = s.find((x) => x.id === "c_atp")!, fer = s.find((x) => x.id === "c_ferment")!;
    expect(etc.mastery).toBeGreaterThan(0.5);
    expect(etc.streak).toBe(2);
    expect(atp.mastery).toBe(0);
    expect(fer.lastSeen).toBeNull();
  });
});

describe("dueConcepts", () => {
  it("unseen and missed concepts are due now; reviewed ones come back after a growing interval", () => {
    const events = [ev("c_etc", true, T0), ev("c_etc", true, T0 + 1), ev("c_atp", false, T0)];
    const due = dueConcepts(conceptStates(map, events), T0 + day, null).map((c) => c.id);
    expect(due).toContain("c_ferment"); // never seen
    expect(due).toContain("c_atp");     // wrong last time
    expect(due).not.toContain("c_etc"); // streak 2 → due in 2 days
    expect(dueConcepts(conceptStates(map, events), T0 + 2 * day + 1, null).map((c) => c.id)).toContain("c_etc");
  });
  it("compresses intervals so reviews land before the test date", () => {
    const events = [1, 2, 3, 4].map((i) => ev("c_etc", true, T0 + i));
    const test = new Date(T0 + 2 * day).toISOString().slice(0, 10);
    expect(dueConcepts(conceptStates(map, events), T0 + day + 1, test).map((c) => c.id)).toContain("c_etc");
  });
});

describe("bossState", () => {
  it("full HP with every concept as a shield when nothing is practiced; defeated when all mastered", () => {
    const fresh = bossState(conceptStates(map, []), null, T0);
    expect(fresh.hp).toBe(fresh.maxHp);
    expect(fresh.shields).toHaveLength(3);
    expect(fresh.defeated).toBe(false);
    const all = map.concepts.flatMap((c) => [1, 2, 3, 4, 5].map((i) => ev(c.id, true, T0 + i)));
    const beaten = bossState(conceptStates(map, all), null, T0);
    expect(beaten.defeated).toBe(true);
    expect(beaten.shields).toHaveLength(0);
    expect(beaten.hp).toBeLessThan(beaten.maxHp * 0.2);
  });
  it("counts days until the test", () => {
    expect(bossState(conceptStates(map, []), "2026-10-04", T0).daysLeft).toBe(3);
  });
});
