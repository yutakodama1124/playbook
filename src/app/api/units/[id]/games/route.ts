import { NextResponse, after } from "next/server";
import { GameModeSchema } from "@/domain/game-spec";
import { getRepo } from "@/repo/supabase";
import { startJob } from "@/pipeline/trigger";
import { decideGameRequest } from "@/pipeline/budget";

export const maxDuration = 300;

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json().catch(() => ({}));
  const mode = GameModeSchema.safeParse(body.mode);
  if (!mode.success) return NextResponse.json({ error: "unknown mode" }, { status: 400 });
  const repo = getRepo();
  const unit = await repo.getUnit(id).catch(() => null);
  if (unit?.status !== "ready") return NextResponse.json({ error: "unit not ready" }, { status: 409 });

  const decision = decideGameRequest(await repo.listGames(id), mode.data, await repo.countCreatedSince("games", new Date(Date.now() - 3600_000).toISOString()));
  if ("reuse" in decision) return NextResponse.json({ id: decision.reuse });
  if ("error" in decision) return NextResponse.json({ error: decision.error }, { status: decision.status });

  const game = await repo.createGame(id, mode.data);
  after(() => startJob({ type: "game", gameId: game.id })
    .catch((e) => repo.updateGame(game.id, { status: "failed", error: e instanceof Error ? e.message : "could not start" })));
  return NextResponse.json({ id: game.id });
}
