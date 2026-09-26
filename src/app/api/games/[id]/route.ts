import { NextResponse } from "next/server";
import { getRepo } from "@/repo/supabase";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const game = await getRepo().getGame(id);
  return game ? NextResponse.json(game) : NextResponse.json({ error: "not found" }, { status: 404 });
}
