"use client";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { loadRecent, rememberUnit, type RecentUnit } from "./components/recent";
import { Button, Card, Label, PageHeader, buttonClass, inputClass } from "./components/ui";
import { CasePreview, EscapePreview, ImpostorPreview } from "./components/landing/Previews";

const MODES = [
  { name: "Case Files", line: "Question suspects. Only the science closes the case.", preview: <CasePreview /> },
  { name: "Escape Room", line: "Every lock opens with a concept, not a guess.", preview: <EscapePreview /> },
  { name: "Impostor", line: "One fact is fake. Find who's bluffing. 3–10 players.", preview: <ImpostorPreview /> },
];
const STEPS = [
  ["Upload your notes", "Slides, PDFs, photos, or pasted text. Playbook maps the key concepts and common mistakes."],
  ["Play the game", "Hints explain the concept instead of giving the answer. Every game is checked to be solvable."],
  ["Beat the boss", "Your test is the boss. Review questions come back on a schedule before test day."],
];

export default function Home() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [recent, setRecent] = useState<RecentUnit[]>([]);
  useEffect(() => { const t = setTimeout(() => setRecent(loadRecent()), 0); return () => clearTimeout(t); }, []);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true); setError(null);
    const form = new FormData(e.currentTarget);
    const res = await fetch("/api/units", { method: "POST", body: form });
    const json = await res.json();
    if (!res.ok) { setError(json.error); setBusy(false); return; }
    rememberUnit({ id: json.id, title: String(form.get("title")), course: String(form.get("course")) });
    router.push(`/units/${json.id}`);
  }

  return (
    <>
      <PageHeader><a href="#start" className={buttonClass("primary", "sm")}>Get started</a></PageHeader>
      <main className="pb-24">
        <section className="mx-auto max-w-3xl px-4 pb-14 pt-20 text-center md:pt-28">
          <h1 className="text-5xl font-semibold tracking-tight text-zinc-950 md:text-6xl">Turn any unit into a game.</h1>
          <p className="mx-auto mt-5 max-w-lg text-lg text-zinc-600">Upload your notes. Play a game you can only win by understanding them.</p>
          <div className="mt-8 flex justify-center gap-3">
            <a href="#start" className={buttonClass("primary", "lg")}>Build a game from my notes</a>
            <a href="#modes" className={buttonClass("secondary", "lg")}>See the games</a>
          </div>
        </section>

        <section id="modes" className="mx-auto max-w-6xl scroll-mt-16 px-4">
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {MODES.map((m) => (
              <div key={m.name} className="flex flex-col">
                <div className="flex flex-1 items-center rounded-2xl bg-zinc-100 p-5"><div className="w-full">{m.preview}</div></div>
                <div className="mt-4 min-h-[4.5rem]"><p className="font-medium">{m.name}</p><p className="mt-1 text-sm text-zinc-600">{m.line}</p></div>
              </div>
            ))}
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-4 pt-24">
          <ol className="grid gap-10 border-t border-zinc-200 pt-10 md:grid-cols-3">
            {STEPS.map(([t, d], i) => (
              <li key={t}><p className="text-sm text-zinc-400">Step {i + 1}</p><p className="mt-1 font-medium">{t}</p><p className="mt-1 text-sm leading-relaxed text-zinc-600">{d}</p></li>
            ))}
          </ol>
        </section>

        <section id="start" className="mx-auto max-w-xl scroll-mt-16 px-4 pt-24">
          <h2 className="text-center text-2xl font-semibold tracking-tight">Start with a unit</h2>
          <Card className="mt-6 p-6">
            <form onSubmit={onSubmit} className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5"><Label>Unit</Label><input name="title" required placeholder="Cellular Respiration" className={inputClass} /></div>
                <div className="space-y-1.5"><Label>Course</Label><input name="course" required placeholder="AP Biology" className={inputClass} /></div>
              </div>
              <div className="space-y-1.5"><Label>Notes</Label><textarea name="notes" rows={4} placeholder="Paste notes, or upload files below" className={inputClass} /></div>
              <div className="space-y-1.5"><Label>Slides, PDFs, or photos</Label>
                <input name="files" type="file" multiple accept=".pdf,.png,.jpg,.jpeg,.webp,.md,.txt" className="block w-full text-sm text-zinc-600 file:mr-3 file:rounded-md file:border file:border-zinc-200 file:bg-white file:px-3 file:py-1.5 file:text-sm file:font-medium" /></div>
              <div className="space-y-1.5"><Label>Test date (optional)</Label><input name="testDate" type="date" className={inputClass} /></div>
              {error && <p className="text-sm text-red-700">{error}</p>}
              <Button type="submit" disabled={busy} size="lg" className="w-full">{busy ? "Uploading…" : "Build my unit"}</Button>
            </form>
          </Card>
          {recent.length > 0 && (
            <div className="mt-10">
              <Label>Your units</Label>
              <div className="mt-2 divide-y divide-zinc-200 rounded-xl border border-zinc-200 bg-white">
                {recent.map((u) => (
                  <a key={u.id} href={`/units/${u.id}`} className="flex items-baseline justify-between px-4 py-3 hover:bg-zinc-50">
                    <span className="font-medium">{u.title}</span><span className="text-sm text-zinc-500">{u.course}</span>
                  </a>
                ))}
              </div>
            </div>
          )}
        </section>
      </main>
    </>
  );
}
