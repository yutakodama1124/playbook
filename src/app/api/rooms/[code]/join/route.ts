import { getRepo } from "@/repo/supabase";
import { joinRoom } from "@/modes/impostor/rooms";
import { handle } from "../../handle";

export async function POST(req: Request, { params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const { name } = await req.json();
  return handle(() => joinRoom(getRepo(), code, String(name ?? "")));
}
