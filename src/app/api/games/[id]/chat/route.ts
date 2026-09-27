import { NextResponse } from "next/server";
import { createLlmClient } from "@/lib/llm";
import { npcReply, type ChatTurn } from "@/modes/case/npc";
import type { CaseContent } from "@/modes/case/schema";
import type { GameSpec } from "@/domain/game-spec";
import { loadReadyGame } from "../../load";

export const maxDuration = 60;

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const g = await loadReadyGame(id);
  if ("error" in g) return g.error;
  if (g.spec.mode !== "case") return NextResponse.json({ error: "chat is only available in Case Files" }, { status: 400 });
  const { characterId, history, question } = (await req.json()) as { characterId: string; history: ChatTurn[]; question: string };
  try {
    return NextResponse.json(await npcReply(createLlmClient(), g.spec as GameSpec<CaseContent>, characterId, history ?? [], String(question ?? "")));
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "chat failed" }, { status: 400 });
  }
}
