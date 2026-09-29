import { NextResponse } from "next/server";
import type { GameSpec } from "@/domain/game-spec";
import { gradeBoard } from "@/modes/case/board";
import type { CaseContent } from "@/modes/case/schema";
import { recordAnswer } from "@/modes/boss/boss";
import { getRepo } from "@/repo/supabase";
import { loadReadyGame } from "../../load";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const g = await loadReadyGame(id);
  if ("error" in g) return g.error;
  if (g.spec.mode !== "case") return NextResponse.json({ error: "not a case" }, { status: 400 });
  const spec = g.spec as GameSpec<CaseContent>;
  const { answers, confirmed } = (await req.json()) as { answers: Record<string, unknown>; confirmed: string[] };
  const result = gradeBoard(spec, answers ?? {}, confirmed ?? []);
  const device = req.headers.get("x-device-id") ?? "";
  for (const rowId of result.confirmed) {
    const check = spec.checks.find((k) => k.id === spec.content.board.find((r) => r.id === rowId)?.check_id);
    if (check) await recordAnswer(getRepo(), { deviceId: device, gameId: id, conceptIds: check.concept_ids, correct: true }).catch(() => {});
  }
  return NextResponse.json(result);
}
