"use client";
import Link from "next/link";
import { fmtClock } from "./scoring";

type Concept = { concept_id: string; title: string; explanation: string };

/** Dark title card: the hook question up front, one button. */
export function Briefing({ title, hook, premise, briefing, bg, rooms, locks, minutes, onStart }: {
  title: string; hook?: string; premise: string; briefing: string; bg?: string; rooms: number; locks: number; minutes: number; onStart: () => void;
}) {
  return (
    <div className="relative min-h-dvh overflow-hidden bg-zinc-950 text-white">
      {/* eslint-disable-next-line @next/next/no-img-element -- decorative backdrop */}
      {bg && <img src={bg} alt="" aria-hidden className="absolute inset-0 h-full w-full scale-110 object-cover opacity-35 blur-sm" />}
      <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/85 to-zinc-950/40" aria-hidden />
      <div className="relative mx-auto flex min-h-dvh max-w-2xl flex-col px-5 pb-10 pt-5">
        <Link href="/" className="text-sm font-semibold text-white/70 hover:text-white">Playbook</Link>
        <main className="flex flex-1 flex-col justify-end pt-16 sm:justify-center">
          <p className="pb-rise text-sm font-semibold uppercase tracking-widest text-amber-300">Escape room</p>
          <h1 className="pb-rise mt-2 text-4xl font-black leading-[1.05] tracking-tight sm:text-6xl">{title}</h1>
          {hook && <p className="pb-rise mt-6 text-xl font-semibold leading-snug text-white sm:text-2xl">{hook}</p>}
          <p className="pb-rise mt-4 text-base leading-relaxed text-zinc-300">{premise}</p>
          <p className="mt-6 flex flex-wrap gap-x-4 gap-y-1 text-sm font-semibold tabular-nums text-zinc-400">
            <span>{rooms} rooms</span><span>{locks} locks</span><span>{minutes} minutes</span>
          </p>
          <button onClick={onStart} autoFocus
            className="pb-pop mt-8 h-16 w-full rounded-2xl bg-amber-300 text-xl font-black text-zinc-950 shadow-[0_0_40px_rgba(252,211,77,.35)] transition hover:bg-amber-200 active:scale-[.98] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-amber-300/50">
            Start
          </button>
          <details className="mt-6 text-sm text-zinc-400">
            <summary className="cursor-pointer font-semibold text-zinc-300 hover:text-white">Read the briefing first</summary>
            <p className="mt-2 leading-relaxed">{briefing}</p>
          </details>
        </main>
      </div>
    </div>
  );
}

export function Debrief({ outro, elapsed, limit, score, hints, locks, bestStreak, concepts, unitHref, onReplay }: {
  outro: string; elapsed: number; limit: number; score: number; hints: number; locks: number; bestStreak: number; concepts: Concept[]; unitHref: string; onReplay: () => void;
}) {
  const beat = elapsed <= limit;
  const stats: [string, string][] = [
    ["Time", fmtClock(elapsed)], ["Score", score.toLocaleString()], ["Hints", String(hints)], ["Best streak", String(bestStreak)],
  ];
  return (
    <div className="min-h-dvh bg-zinc-950 text-white">
      <main className="mx-auto max-w-2xl px-5 pb-16 pt-10">
        <p className="pb-stamp inline-block rounded-lg border-4 border-emerald-400 px-4 py-1 text-3xl font-black uppercase tracking-tight text-emerald-400">Escaped</p>
        <h1 className="pb-rise mt-6 text-2xl font-bold leading-snug sm:text-3xl">{outro}</h1>
        <p className="mt-2 text-sm text-zinc-400">{beat ? `You beat the clock with ${fmtClock(limit - elapsed)} to spare.` : "The clock ran out, but you finished anyway."} {locks} locks opened.</p>

        <dl className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {stats.map(([k, v], i) => (
            <div key={k} className="pb-pop rounded-xl border border-white/10 bg-white/5 px-4 py-3" style={{ animationDelay: `${150 + i * 90}ms` }}>
              <dt className="text-xs font-semibold text-zinc-400">{k}</dt>
              <dd className="mt-1 text-2xl font-black tabular-nums">{v}</dd>
            </div>
          ))}
        </dl>

        <section className="mt-10">
          <h2 className="text-lg font-bold">What you used to get out</h2>
          <ul className="mt-3 space-y-3">
            {concepts.map((f) => (
              <li key={f.concept_id} className="rounded-xl border border-white/10 bg-white/[.03] px-4 py-3">
                <p className="font-semibold text-emerald-300">{f.title}</p>
                <p className="mt-1 text-sm leading-relaxed text-zinc-300">{f.explanation}</p>
              </li>
            ))}
          </ul>
        </section>

        <div className="mt-10 grid gap-3 sm:grid-cols-2">
          <Link href={unitHref} className="grid h-14 place-items-center rounded-xl bg-white text-base font-bold text-zinc-950 hover:bg-zinc-200 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-white/40">Back to the unit</Link>
          <button onClick={onReplay} className="h-14 rounded-xl border border-white/20 text-base font-bold text-white hover:bg-white/10 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-white/30">Play again</button>
        </div>
      </main>
    </div>
  );
}
