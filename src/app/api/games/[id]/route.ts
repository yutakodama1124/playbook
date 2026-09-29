import { NextResponse } from "next/server";
import { getRepo } from "@/repo/supabase";
import { toPublicSpec } from "@/domain/public-spec";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const game = await getRepo().getGame(id);
  if (!game) return NextResponse.json({ error: "not found" }, { status: 404 });
  // Never send answers or secrets to the browser. Reviewer notes can contain answer fixes, so only counts go out.
  const report = game.verifierReport ? { ok: game.verifierReport.ok, count: game.verifierReport.problems.length } : null;
  return NextResponse.json({ ...game, spec: game.spec ? toPublicSpec(game.spec) : null, verifierReport: report,
    error: game.status === "failed" ? "The game didn't pass quality checks." : null });
}
