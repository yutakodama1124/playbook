import { NextResponse } from "next/server";
import { getRepo } from "@/repo/supabase";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const unit = await getRepo().getUnit(id);
  if (!unit) return NextResponse.json({ error: "not found" }, { status: 404 });
  const { input: _input, ...rest } = unit; // eslint-disable-line @typescript-eslint/no-unused-vars
  return NextResponse.json(rest);
}
