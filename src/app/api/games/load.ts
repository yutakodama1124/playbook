import { NextResponse } from "next/server";
import { getRepo } from "@/repo/supabase";
import type { GameSpec } from "@/domain/game-spec";

/** Loads a ready game or returns an error response. */
export async function loadReadyGame(id: string): Promise<{ spec: GameSpec } | { error: NextResponse }> {
  const game = await getRepo().getGame(id);
  if (!game) return { error: NextResponse.json({ error: "not found" }, { status: 404 }) };
  if (game.status !== "ready" || !game.spec) return { error: NextResponse.json({ error: "game not ready" }, { status: 409 }) };
  return { spec: game.spec };
}
