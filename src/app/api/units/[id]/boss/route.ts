import { NextResponse } from "next/server";
import { getRepo } from "@/repo/supabase";
import { getBoss } from "@/modes/boss/boss";

export const dynamic = "force-dynamic";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    return NextResponse.json(await getBoss(getRepo(), id, req.headers.get("x-device-id") ?? ""));
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "boss unavailable" }, { status: 400 });
  }
}
