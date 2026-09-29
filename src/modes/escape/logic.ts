import type { ConceptMap } from "@/domain/concept-map";
import type { GameSpec } from "@/domain/game-spec";
import type { EscapeContent } from "./schema";

export function validateEscape(spec: GameSpec<EscapeContent>, map: ConceptMap): string[] {
  const c = spec.content, problems: string[] = [];
  const checkIds = new Set(spec.checks.map((k) => k.id));
  const concepts = new Set(map.concepts.map((x) => x.id));
  const used = new Map<string, number>();
  if (c.rooms.length !== 2) problems.push(`escape room needs exactly 2 rooms, got ${c.rooms.length}`);
  for (const r of c.rooms) {
    if (r.hotspots.length < 3) problems.push(`room ${r.id} needs at least 3 hotspots`);
    const locks = r.hotspots.filter((h) => h.lock_check_id);
    if (r.hotspots.length - locks.length < 1) problems.push(`room ${r.id} needs at least 1 clue object (hotspot with no lock) holding information for its locks`);
    if (locks.length < 2) problems.push(`room ${r.id} needs at least 2 locks`);
    for (const h of locks) {
      if (!checkIds.has(h.lock_check_id)) problems.push(`hotspot ${h.id} lock ${h.lock_check_id} is not a check`);
      used.set(h.lock_check_id, (used.get(h.lock_check_id) ?? 0) + 1);
    }
  }
  // Meta-puzzle: one exit lock in the last room, fed by fragments from every other lock.
  const exits = c.rooms.flatMap((r, i) => r.hotspots.filter((h) => h.is_exit).map((h) => ({ h, last: i === c.rooms.length - 1 })));
  if (exits.length !== 1) problems.push(`escape room needs exactly 1 exit lock (is_exit), got ${exits.length}`);
  for (const { h, last } of exits) {
    if (!last) problems.push(`exit lock ${h.id} must be in the last room`);
    if (!h.lock_check_id) problems.push(`exit ${h.id} must be a lock`);
  }
  for (const r of c.rooms) for (const h of r.hotspots)
    if (h.lock_check_id && !h.is_exit && !h.reveals_clue.trim()) problems.push(`lock ${h.id} must reveal a fragment (reveals_clue) that feeds the final exit`);
  for (const [id, n] of used) if (n > 1) problems.push(`check ${id} is used by more than one hotspot`);
  for (const id of checkIds) if (!used.has(id)) problems.push(`check ${id} is not used by any hotspot`);
  for (const f of c.field_guide) if (!concepts.has(f.concept_id)) problems.push(`field guide references unknown concept ${f.concept_id}`);
  return problems;
}

/** Public view: everything except clues (released by the check API once a lock is solved). */
export function redactEscape(c: EscapeContent) {
  return { ...c, rooms: c.rooms.map((r) => ({ ...r, hotspots: r.hotspots.map(({ reveals_clue: _clue, ...h }) => h) })) }; // eslint-disable-line @typescript-eslint/no-unused-vars
}
export type PublicEscapeContent = ReturnType<typeof redactEscape>;

export function clueFor(spec: GameSpec<EscapeContent>, checkId: string): string | null {
  for (const r of spec.content.rooms) for (const h of r.hotspots) if (h.lock_check_id === checkId) return h.reveals_clue || null;
  return null;
}

export function escapeAssetRequests(c: EscapeContent): GameSpec["asset_requests"] {
  return c.rooms.map((r) => ({ role: `scene:${r.id}`, tags: r.scene_tags }));
}
