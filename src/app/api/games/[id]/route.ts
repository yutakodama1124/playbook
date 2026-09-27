import { NextResponse } from "next/server";
import { getRepo } from "@/repo/supabase";
import { toPublicSpec } from "@/domain/public-spec";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const game = await getRepo().getGame(id);
  if (!game) return NextResponse.json({ error: "not found" }, { status: 404 });
  // Never send answers or secrets to the browser.
  return NextResponse.json({ ...game, spec: game.spec ? toPublicSpec(game.spec) : null });
}
