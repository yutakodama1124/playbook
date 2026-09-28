import type { ConceptMap } from "@/domain/concept-map";

export type MasteryEvent = { conceptIds: string[]; correct: boolean; at: number };
export type ConceptState = { id: string; name: string; mastery: number; streak: number; lastSeen: number | null };

const DAY = 86_400_000;
const INTERVAL_DAYS = [0, 1, 2, 4, 8]; // by streak of consecutive correct answers
export const SHIELD_BELOW = 0.4, MASTERED_AT = 0.8;

/** Replays answer history per concept: correct answers close 35% of the remaining gap, wrong ones lose 40%. */
export function conceptStates(map: ConceptMap, events: MasteryEvent[]): ConceptState[] {
  const states = new Map(map.concepts.map((c) => [c.id, { id: c.id, name: c.name, mastery: 0, streak: 0, lastSeen: null as number | null }]));
  for (const e of [...events].sort((a, b) => a.at - b.at))
    for (const id of e.conceptIds) {
      const s = states.get(id);
      if (!s) continue;
      s.mastery = e.correct ? s.mastery + (1 - s.mastery) * 0.35 : s.mastery * 0.6;
      s.streak = e.correct ? s.streak + 1 : 0;
      s.lastSeen = e.at;
    }
  return [...states.values()];
}

function testStart(testDate: string | null) {
  return testDate ? Date.parse(`${testDate}T00:00:00Z`) : null;
}

/** Concepts due for review now (spaced repetition, compressed so the last review lands the day before the test). */
export function dueConcepts(states: ConceptState[], now: number, testDate: string | null): ConceptState[] {
  const test = testStart(testDate);
  return states.filter((s) => {
    if (s.lastSeen === null || s.streak === 0) return true;
    let dueAt = s.lastSeen + INTERVAL_DAYS[Math.min(s.streak, INTERVAL_DAYS.length - 1)] * DAY;
    if (test !== null && test - DAY > s.lastSeen) dueAt = Math.min(dueAt, test - DAY);
    return dueAt <= now;
  }).sort((a, b) => a.mastery - b.mastery);
}

export function bossState(states: ConceptState[], testDate: string | null, now: number) {
  const maxHp = states.length * 100;
  const hp = states.reduce((sum, s) => sum + Math.round(100 * (1 - s.mastery)), 0);
  const test = testStart(testDate);
  return {
    maxHp, hp,
    shields: states.filter((s) => s.mastery < SHIELD_BELOW).map((s) => ({ id: s.id, name: s.name })),
    defeated: states.length > 0 && states.every((s) => s.mastery >= MASTERED_AT),
    daysLeft: test === null ? null : Math.ceil((test - now) / DAY),
    concepts: states.map((s) => ({ id: s.id, name: s.name, mastery: Math.round(s.mastery * 100) })),
  };
}
export type BossState = ReturnType<typeof bossState>;
