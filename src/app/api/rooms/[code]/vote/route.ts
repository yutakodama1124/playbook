import { getRepo } from "@/repo/supabase";
import { castVote } from "@/modes/impostor/rooms";
import { handle } from "../../handle";

export async function POST(req: Request, { params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const { targetId } = await req.json();
  const token = req.headers.get("x-room-token") ?? "";
  return handle(() => castVote(getRepo(), code, token, String(targetId)));
}
