import { NextResponse } from "next/server";
import { loadReadyGame } from "../../load";
import { press, present, verdict } from "@/modes/case/trial";
import { recordAnswer } from "@/modes/boss/boss";
import { getRepo } from "@/repo/supabase";
import type { CaseContent } from "@/modes/case/schema";
import type { GameSpec } from "@/domain/game-spec";

/** Case Files trial actions. All grading is deterministic; secrets stay on the server until earned. */
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const g = await loadReadyGame(id);
  if ("error" in g) return g.error;
  if (g.spec.mode !== "case" || !(g.spec.content as Partial<CaseContent>).testimonies)
    return NextResponse.json({ error: "not a trial case" }, { status: 400 });
  const spec = g.spec as GameSpec<CaseContent>;
  const body = await req.json().catch(() => ({}));
  const device = req.headers.get("x-device-id") ?? "";
  const track = (conceptIds: string[], correct: boolean) =>
    recordAnswer(getRepo(), { deviceId: device, gameId: id, conceptIds, correct }).catch(() => {}); // tracking must never break play
  try {
    if (body.action === "press") return NextResponse.json(press(spec, body.testimonyId, body.statementId));
    if (body.action === "present") {
      const r = present(spec, body.testimonyId, body.statementId, body.evidenceId);
      await track([r.conceptId], r.correct);
      return NextResponse.json(r);
    }
    if (body.action === "verdict") {
      const r = verdict(spec, body.optionId, body.evidenceId);
      const won = r.correct && r.proofCorrect;
      // A miss only says what was wrong, so the player can retry; the full answer is revealed on a win or when the player is out of lives.
      if (!won && !body.reveal) return NextResponse.json({ correct: r.correct, proofCorrect: r.proofCorrect, feedback: r.feedback });
      await track(spec.concept_ids, won);
      return NextResponse.json(r);
    }
  } catch {
    return NextResponse.json({ error: "unknown id" }, { status: 400 });
  }
  return NextResponse.json({ error: "unknown action" }, { status: 400 });
}
