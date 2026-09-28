"use client";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { loadRecent, rememberUnit, type RecentUnit } from "./components/recent";
import { Button, Card, Label, PageHeader, inputClass } from "./components/ui";

const ART = "https://zyxnnfgoyosgjngoapsw.supabase.co/storage/v1/object/public/assets/library";
const MODES = [
  { name: "Case Files", img: `${ART}/import-scene-detective-office.png`, text: "Question suspects and read the evidence. The case only closes when you apply the science." },
  { name: "Escape Room", img: `${ART}/import-scene-chemistry-lab-night.png`, text: "Two rooms, twenty minutes. Each lock opens with a calculation, a prediction, or a process in order." },
  { name: "Impostor", img: `${ART}/import-scene-museum-gallery.png`, text: "Everyone gets a fact card; one is subtly wrong. Explain, argue, and vote. 3–10 players on phones." },
];
const STEPS = [
  ["Map the unit", "Your notes or slides become a map of the key concepts, where each appears in your material, and the mistakes students usually make."],
  ["Play to learn", "Games are built so that guessing doesn't work. Hints explain the concept instead of giving the answer, and every game is checked for solvability."],
  ["Beat the boss", "Your test becomes a boss. Weak concepts are its shields, and review questions return on a spaced schedule before test day."],
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
      <PageHeader />
      <main className="mx-auto max-w-6xl px-4 pb-24">
        <section className="grid gap-12 py-16 md:grid-cols-[1.15fr_1fr] md:items-start md:py-24">
          <div className="max-w-xl">
            <h1 className="text-4xl font-semibold leading-[1.1] tracking-tight text-zinc-950 md:text-[52px]">Turn any unit into a game you can only win by understanding it.</h1>
            <p className="mt-6 text-lg leading-relaxed text-zinc-600">Upload your class notes or slides. Playbook builds a mystery, an escape room, or a party game from that exact material, then tracks which concepts you&apos;ve mastered before the test.</p>
            <p className="mt-6 text-sm text-zinc-500">Works with any subject. Built for high school and AP courses.</p>
          </div>
          <Card className="p-6">
            <form onSubmit={onSubmit} className="space-y-4">
              <p className="text-[15px] font-semibold">Start with a unit</p>
              <div className="space-y-1.5"><Label>Unit</Label><input name="title" required placeholder="Cellular Respiration" className={inputClass} /></div>
              <div className="space-y-1.5"><Label>Course</Label><input name="course" required placeholder="AP Biology" className={inputClass} /></div>
              <div className="space-y-1.5"><Label>Notes</Label><textarea name="notes" rows={4} placeholder="Paste notes, or upload files below" className={inputClass} /></div>
              <div className="space-y-1.5"><Label>Slides, PDFs, or photos</Label>
                <input name="files" type="file" multiple accept=".pdf,.png,.jpg,.jpeg,.webp,.md,.txt" className="block w-full text-sm text-zinc-600 file:mr-3 file:rounded-md file:border file:border-zinc-200 file:bg-white file:px-3 file:py-1.5 file:text-sm file:font-medium" /></div>
              <div className="space-y-1.5"><Label>Test date</Label><input name="testDate" type="date" className={inputClass} /></div>
              {error && <p className="text-sm text-red-700">{error}</p>}
              <Button type="submit" disabled={busy} size="lg" className="w-full">{busy ? "Uploading…" : "Build my unit"}</Button>
            </form>
          </Card>
        </section>

        {recent.length > 0 && (
          <section className="border-t border-zinc-200 py-12">
            <h2 className="text-lg font-semibold">Your units</h2>
            <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {recent.map((u) => (
                <a key={u.id} href={`/units/${u.id}`} className="rounded-xl border border-zinc-200 bg-white px-4 py-3 transition-colors hover:border-zinc-400">
                  <p className="font-medium">{u.title}</p><p className="text-sm text-zinc-500">{u.course}</p>
                </a>
              ))}
            </div>
          </section>
        )}

        <section className="border-t border-zinc-200 py-12">
          <h2 className="text-lg font-semibold">Three ways to play</h2>
          <div className="mt-4 grid gap-6 md:grid-cols-3">
            {MODES.map((m) => (
              <div key={m.name}>
                <img src={m.img} alt="" className="aspect-[16/10] w-full rounded-xl border border-zinc-200 object-cover" />
                <p className="mt-3 font-medium">{m.name}</p>
                <p className="mt-1 text-sm leading-relaxed text-zinc-600">{m.text}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="border-t border-zinc-200 py-12">
          <h2 className="text-lg font-semibold">How it works</h2>
          <ol className="mt-4 grid gap-8 md:grid-cols-3">
            {STEPS.map(([t, d], i) => (
              <li key={t}><p className="text-sm text-zinc-400">Step {i + 1}</p><p className="mt-1 font-medium">{t}</p><p className="mt-1 text-sm leading-relaxed text-zinc-600">{d}</p></li>
            ))}
          </ol>
        </section>
      </main>
    </>
  );
}
