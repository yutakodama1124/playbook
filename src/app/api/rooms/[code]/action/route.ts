import { getRepo } from "@/repo/supabase";
import { hostAction, type HostAction } from "@/modes/impostor/rooms";
import { handle } from "../../handle";

const ACTIONS: HostAction[] = ["next", "vote", "reveal"];

export async function POST(req: Request, { params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const { action } = await req.json();
  const token = req.headers.get("x-room-token") ?? "";
  if (!ACTIONS.includes(action)) return handle(async () => { throw new Error("unknown action"); });
  return handle(() => hostAction(getRepo(), code, token, action));
}
