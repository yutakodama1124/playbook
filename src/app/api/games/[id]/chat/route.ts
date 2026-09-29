import { NextResponse } from "next/server";
import { createLlmClient } from "@/lib/llm";
import { npcReply, type ChatTurn } from "@/modes/case/npc";
import type { CaseContent } from "@/modes/case/schema";
import type { GameSpec } from "@/domain/game-spec";
import { loadReadyGame } from "../../load";
import { allow, clientIp } from "../../../rate-limit";

export const maxDuration = 60;

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const g = await loadReadyGame(id);
  if ("error" in g) return g.error;
  if (g.spec.mode !== "case") return NextResponse.json({ error: "chat is only available in Case Files" }, { status: 400 });
  if (!allow(`chat:${clientIp(req)}`, 30, 60_000)) return NextResponse.json({ error: "Slow down a little — too many questions at once." }, { status: 429 });
  const body = (await req.json().catch(() => ({}))) as { characterId?: string; history?: unknown; question?: string };
  // Only trust well-formed, short turns: stops oversized payloads and forged "character" lines.
  const history: ChatTurn[] = (Array.isArray(body.history) ? body.history : []).slice(-12)
    .filter((t): t is ChatTurn => !!t && (t.role === "student" || t.role === "character") && typeof t.text === "string")
    .map((t) => ({ role: t.role, text: t.text.slice(0, 600) }));
  const characterId = String(body.characterId ?? ""), question = String(body.question ?? "");
  try {
    return NextResponse.json(await npcReply(createLlmClient(), g.spec as GameSpec<CaseContent>, characterId, history, question));
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "chat failed" }, { status: 400 });
  }
}
