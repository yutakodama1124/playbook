import { NextResponse, after } from "next/server";
import { getRepo } from "@/repo/supabase";
import { startJob } from "@/pipeline/trigger";
import type { UnitSource } from "@/pipeline/ingest";
import { fileToSource } from "../parse-upload";

export const maxDuration = 300;
const MAX_BYTES = 25 * 1024 * 1024;

export async function POST(req: Request) {
  const form = await req.formData();
  const title = String(form.get("title") ?? "").trim();
  const course = String(form.get("course") ?? "").trim();
  if (!title || !course) return NextResponse.json({ error: "title and course are required" }, { status: 400 });
  const testDate = String(form.get("testDate") ?? "") || null;
  const sources: UnitSource[] = [];
  const notes = String(form.get("notes") ?? "").trim();
  if (notes) sources.push({ kind: "text", text: notes });
  let total = 0;
  for (const f of form.getAll("files")) {
    if (!(f instanceof File) || f.size === 0) continue;
    total += f.size;
    if (total > MAX_BYTES) return NextResponse.json({ error: "Files too large (max 25MB total)" }, { status: 413 });
    const s = fileToSource(f.name, f.type, await f.arrayBuffer());
    if (!s) return NextResponse.json({ error: `Unsupported file: ${f.name}` }, { status: 415 });
    sources.push(s);
  }
  const unit = await getRepo().createUnit({ title, course, sources }, testDate);
  after(() => startJob({ type: "unit", unitId: unit.id }));
  return NextResponse.json({ id: unit.id });
}
