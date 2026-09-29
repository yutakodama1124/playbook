import type { GameMode } from "@/domain/game-spec";
import type { GameRow } from "@/repo/types";

/** Cost guards for public endpoints that trigger paid model and image API calls. */
export const LIMITS = { gamesPerUnit: 12, gamesPerHour: 40, unitsPerHour: 20, uploadBytes: 4 * 1024 * 1024 };

export type GameDecision = { reuse: string } | { ok: true } | { error: string; status: number };

export function decideGameRequest(unitGames: GameRow[], mode: GameMode, gamesLastHour: number): GameDecision {
  const building = unitGames.find((x) => x.mode === mode && (x.status === "queued" || x.status === "running"));
  if (building) return { reuse: building.id }; // double-clicks and repeated retries share one job
  if (unitGames.length >= LIMITS.gamesPerUnit) return { error: "This unit has reached its game limit. Play one of its existing games.", status: 429 };
  if (gamesLastHour >= LIMITS.gamesPerHour) return { error: "Playbook is busy right now. Try again in a little while.", status: 429 };
  return { ok: true };
}
