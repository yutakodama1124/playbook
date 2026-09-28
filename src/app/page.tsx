"use client";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { loadRecent, rememberUnit, type RecentUnit } from "./components/recent";

const ART = "https://zyxnnfgoyosgjngoapsw.supabase.co/storage/v1/object/public/assets/library";
const MODES = [
  { name: "Case Files", img: `${ART}/import-scene-detective-office.png`, text: "Interrogate suspects and read the evidence. Only the science cracks the case." },
  { name: "Escape Room", img: `${ART}/import-scene-chemistry-lab-night.png`, text: "Every lock opens by applying a concept. Twenty minutes on the clock." },
  { name: "Impostor", img: `${ART}/import-portrait-student-teen-a.png`, text: "One friend's fact is fake. Explain, argue, vote. Up to 10 players on phones." },
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
    <main className="pb-16">
      <section className="bg-stone-900 text-white">
        <div className="mx-auto grid max-w-6xl gap-10 px-4 py-14 md:grid-cols-[1.1fr_1fr] md:items-center">
          <div className="space-y-5">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-amber-300">Playbook</p>
            <h1 className="text-4xl font-bold leading-tight md:text-5xl">Turn any unit into a game you can only win by understanding it.</h1>
            <p className="text-lg text-stone-300">Upload your class notes or slides. Playbook builds a mystery, an escape room, or a party game from your exact material — then tracks what you&apos;ve mastered before the test.</p>
          </div>
          <form onSubmit={onSubmit} className="space-y-3 rounded-2xl bg-white p-5 text-stone-900 shadow-xl">
            <p className="font-semibold">Start with a unit</p>
            <input name="title" required placeholder="Unit (e.g. Cellular Respiration)" className="w-full rounded-lg border p-3" />
            <input name="course" required placeholder="Course (e.g. AP Biology)" className="w-full rounded-lg border p-3" />
            <textarea name="notes" rows={4} placeholder="Paste notes (optional)" className="w-full rounded-lg border p-3" />
            <label className="block text-sm text-stone-600">Slides, PDFs, or photos of notes (optional)
              <input name="files" type="file" multiple accept=".pdf,.png,.jpg,.jpeg,.webp,.md,.txt" className="mt-1 block w-full text-sm" />
            </label>
            <label className="block text-sm text-stone-600">Test date (optional)
              <input name="testDate" type="date" className="mt-1 w-full rounded-lg border p-2" />
            </label>
            {error && <p className="text-rose-700">{error}</p>}
            <button disabled={busy} className="w-full rounded-lg bg-stone-900 p-3 font-semibold text-white disabled:opacity-50">{busy ? "Uploading…" : "Build my unit"}</button>
          </form>
        </div>
      </section>

      {recent.length > 0 && (
        <section className="mx-auto max-w-6xl px-4 pt-10">
          <h2 className="text-xl font-bold">Your units</h2>
          <div className="mt-3 flex flex-wrap gap-2">
            {recent.map((u) => <a key={u.id} href={`/units/${u.id}`} className="rounded-xl border border-stone-300 bg-white px-4 py-2 hover:border-stone-900"><span className="font-semibold">{u.title}</span> <span className="text-sm text-stone-500">{u.course}</span></a>)}
          </div>
        </section>
      )}

      <section className="mx-auto max-w-6xl px-4 pt-12">
        <h2 className="text-xl font-bold">Three ways to play</h2>
        <div className="mt-4 grid gap-4 md:grid-cols-3">
          {MODES.map((m) => (
            <div key={m.name} className="overflow-hidden rounded-2xl bg-white shadow-sm">
              <img src={m.img} alt="" className="aspect-video w-full object-cover" />
              <div className="p-4"><p className="font-bold">{m.name}</p><p className="mt-1 text-sm text-stone-600">{m.text}</p></div>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 pt-12">
        <h2 className="text-xl font-bold">How it works</h2>
        <ol className="mt-4 grid gap-4 md:grid-cols-3">
          {[
            ["Map the unit", "Your material becomes a Concept Map: the key ideas, where they appear in your notes, and the mistakes students usually make."],
            ["Play to learn", "Every lock, clue, and vote needs a real concept. Hints teach instead of telling. Each game is checked to be solvable before you see it."],
            ["Beat the boss", "Your test is a boss. Weak concepts are its shields. Daily review brings back what you're about to forget."],
          ].map(([t, d], i) => (
            <li key={t} className="rounded-2xl bg-white p-5"><p className="text-sm font-bold text-amber-700">Step {i + 1}</p><p className="mt-1 font-bold">{t}</p><p className="mt-1 text-sm text-stone-600">{d}</p></li>
          ))}
        </ol>
      </section>
    </main>
  );
}
