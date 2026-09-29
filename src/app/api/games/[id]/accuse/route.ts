import { NextResponse } from "next/server";
import { createLlmClient } from "@/lib/llm";
import { gradeAccusation } from "@/modes/case/accuse";
import type { CaseContent } from "@/modes/case/schema";
import type { GameSpec } from "@/domain/game-spec";
import { loadReadyGame } from "../../load";
import { allow, clientIp } from "../../../rate-limit";
import { recordAnswer } from "@/modes/boss/boss";
import { getRepo } from "@/repo/supabase";

export const maxDuration = 60;

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const g = await loadReadyGame(id);
  if ("error" in g) return g.error;
  if (g.spec.mode !== "case") return NextResponse.json({ error: "not a case" }, { status: 400 });
  if (!allow(`accuse:${clientIp(req)}`, 10, 60_000)) return NextResponse.json({ error: "Too many attempts. Wait a minute and try again." }, { status: 429 });
  const { optionId, justification } = await req.json().catch(() => ({}));
  try {
    const result = await gradeAccusation(createLlmClient(), g.spec as GameSpec<CaseContent>, String(optionId), String(justification ?? ""));
    const device = req.headers.get("x-device-id") ?? "";
    // Each reasoning step counts toward its concept: stated steps as correct, missed steps as wrong.
    for (const s of result.steps)
      await recordAnswer(getRepo(), { deviceId: device, gameId: id, conceptIds: [s.concept_id], correct: result.correct && s.covered }).catch(() => {});
    return NextResponse.json(result);
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "grading failed" }, { status: 400 });
  }
}
