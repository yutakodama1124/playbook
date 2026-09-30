import { NextResponse } from "next/server";
import { checkAnswer } from "@/domain/check";
import { loadReadyGame } from "../../load";
import { clueFor } from "@/modes/escape/logic";
import { recordAnswer } from "@/modes/boss/boss";
import { getRepo } from "@/repo/supabase";
import type { EscapeContent } from "@/modes/escape/schema";
import type { GameSpec } from "@/domain/game-spec";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const g = await loadReadyGame(id);
  if ("error" in g) return g.error;
  const { checkId, response } = await req.json().catch(() => ({}));
  const check = g.spec.checks.find((c) => c.id === checkId);
  if (!check) return NextResponse.json({ error: "unknown check" }, { status: 400 });
  const result = checkAnswer(check, response);
  const device = req.headers.get("x-device-id") ?? "";
  await recordAnswer(getRepo(), { deviceId: device, gameId: id, conceptIds: check.concept_ids, correct: result.correct }).catch(() => {}); // tracking must never break play
  // Escape Room: a solved lock releases its clue (kept server-side until then).
  const reveal = result.correct && g.spec.mode === "escape" ? clueFor(g.spec as GameSpec<EscapeContent>, check.id) : null;
  return NextResponse.json({ ...result, reveal });
}
