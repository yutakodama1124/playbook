import { getRepo } from "@/repo/supabase";
import { createRoom } from "@/modes/impostor/rooms";
import { handle } from "./handle";

export async function POST(req: Request) {
  const { gameId } = await req.json();
  return handle(() => createRoom(getRepo(), String(gameId)));
}
