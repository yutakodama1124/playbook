import { getRepo } from "@/repo/supabase";
import { roomView } from "@/modes/impostor/rooms";
import { handle } from "../handle";

export const dynamic = "force-dynamic";

export async function GET(req: Request, { params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const token = req.headers.get("x-room-token"); // header, not URL, so tokens don't leak into logs/links
  return handle(() => roomView(getRepo(), code, token));
}
