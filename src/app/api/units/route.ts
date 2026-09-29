import { NextResponse, after } from "next/server";
import { getRepo } from "@/repo/supabase";
import { startJob } from "@/pipeline/trigger";
import type { UnitSource } from "@/pipeline/ingest";
import { fileToSource } from "../parse-upload";
import { LIMITS } from "@/pipeline/budget";

export const maxDuration = 300;
const MAX_BYTES = LIMITS.uploadBytes; // Vercel rejects request bodies over ~4.5MB anyway

export async function POST(req: Request) {
  const repo = getRepo();
  if ((await repo.countCreatedSince("units", new Date(Date.now() - 3600_000).toISOString())) >= LIMITS.unitsPerHour)
    return NextResponse.json({ error: "Playbook is busy right now. Try again in a little while." }, { status: 429 });
  const form = await req.formData().catch(() => null);
  if (!form) return NextResponse.json({ error: "Upload failed. Files must be under 4 MB in total." }, { status: 400 });
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
    if (total > MAX_BYTES) return NextResponse.json({ error: "Files are too large (4 MB total max). Try fewer pages or a smaller photo." }, { status: 413 });
    const s = fileToSource(f.name, f.type, await f.arrayBuffer());
    if (!s) return NextResponse.json({ error: `Unsupported file: ${f.name}` }, { status: 415 });
    sources.push(s);
  }
  const unit = await repo.createUnit({ title, course, sources }, testDate);
  after(() => startJob({ type: "unit", unitId: unit.id })
    .catch((e) => repo.updateUnit(unit.id, { status: "failed", error: e instanceof Error ? e.message : "could not start" })));
  return NextResponse.json({ id: unit.id });
}
