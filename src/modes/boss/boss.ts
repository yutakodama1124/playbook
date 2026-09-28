import { pickAsset } from "@/assets/library";
import { toPublicSpec, type PublicCheck } from "@/domain/public-spec";
import type { Repo } from "@/repo/types";
import { bossState, conceptStates, dueConcepts } from "./mastery";

const ATTACK_SIZE = 5;

export async function recordAnswer(repo: Repo, e: { deviceId: string; gameId: string; conceptIds: string[]; correct: boolean }) {
  if (!e.deviceId || !e.conceptIds.length) return;
  const game = await repo.getGame(e.gameId);
  if (!game) return;
  await repo.addMasteryEvent({ deviceId: e.deviceId, unitId: game.unitId, gameId: e.gameId, conceptIds: e.conceptIds, correct: e.correct });
}

export async function getBoss(repo: Repo, unitId: string, deviceId: string, now = Date.now()) {
  const unit = await repo.getUnit(unitId);
  if (!unit?.conceptMap) throw new Error("unit not ready");
  const events = (await repo.listMasteryEvents(deviceId, unitId)).map((e) => ({ conceptIds: e.conceptIds, correct: e.correct, at: Date.parse(e.createdAt) }));
  const states = conceptStates(unit.conceptMap, events);
  const boss = bossState(states, unit.testDate, now);

  // Boss art: the library boss that best matches the subject, else a stable pick.
  const bosses = (await repo.listAssets()).filter((a) => a.kind === "boss");
  const art = pickAsset(bosses, `${unit.course} ${unit.title}`.toLowerCase().split(/\W+/), 1)?.url
    ?? bosses[[...unitId].reduce((h, ch) => h + ch.charCodeAt(0), 0) % Math.max(bosses.length, 1)]?.url ?? null;

  // Daily attack: reuse already-generated checks (no AI cost) for the concepts due for review, weakest first.
  const games = (await repo.listGames(unitId)).filter((g) => g.status === "ready" && g.spec);
  const pool = games.flatMap((g) => toPublicSpec(g.spec!).checks.map((check) => ({ gameId: g.id, check })));
  const attack: { gameId: string; conceptId: string; check: PublicCheck }[] = [];
  const used = new Set<string>();
  for (const c of dueConcepts(states, now, unit.testDate)) {
    const hit = pool.find((p) => !used.has(`${p.gameId}:${p.check.id}`) && p.check.concept_ids.includes(c.id));
    if (!hit) continue;
    used.add(`${hit.gameId}:${hit.check.id}`);
    attack.push({ ...hit, conceptId: c.id });
    if (attack.length >= ATTACK_SIZE) break;
  }
  return { unit: { id: unit.id, title: unit.title, course: unit.course, testDate: unit.testDate }, boss, art, attack };
}
