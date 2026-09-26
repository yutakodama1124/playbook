import { NextResponse, after } from "next/server";
import { GameModeSchema } from "@/domain/game-spec";
import { getRepo } from "@/repo/supabase";
import { startJob } from "@/pipeline/trigger";

export const maxDuration = 300;

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const mode = GameModeSchema.safeParse((await req.json()).mode);
  if (!mode.success) return NextResponse.json({ error: "unknown mode" }, { status: 400 });
  const unit = await getRepo().getUnit(id);
  if (unit?.status !== "ready") return NextResponse.json({ error: "unit not ready" }, { status: 409 });
  const game = await getRepo().createGame(id, mode.data);
  after(() => startJob({ type: "game", gameId: game.id }));
  return NextResponse.json({ id: game.id });
}
