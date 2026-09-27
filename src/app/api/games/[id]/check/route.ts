import { NextResponse } from "next/server";
import { checkAnswer } from "@/domain/check";
import { loadReadyGame } from "../../load";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const g = await loadReadyGame(id);
  if ("error" in g) return g.error;
  const { checkId, response } = await req.json();
  const check = g.spec.checks.find((c) => c.id === checkId);
  if (!check) return NextResponse.json({ error: "unknown check" }, { status: 400 });
  return NextResponse.json(checkAnswer(check, response));
}
