import { NextResponse } from "next/server";
import { createLlmClient } from "@/lib/llm";
import { gradeAccusation } from "@/modes/case/accuse";
import type { CaseContent } from "@/modes/case/schema";
import type { GameSpec } from "@/domain/game-spec";
import { loadReadyGame } from "../../load";

export const maxDuration = 60;

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const g = await loadReadyGame(id);
  if ("error" in g) return g.error;
  if (g.spec.mode !== "case") return NextResponse.json({ error: "not a case" }, { status: 400 });
  const { optionId, justification } = await req.json();
  try {
    return NextResponse.json(await gradeAccusation(createLlmClient(), g.spec as GameSpec<CaseContent>, String(optionId), String(justification ?? "")));
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "grading failed" }, { status: 400 });
  }
}
