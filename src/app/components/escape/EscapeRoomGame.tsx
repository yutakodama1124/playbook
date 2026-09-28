"use client";
import { useEffect, useState } from "react";
import type { PublicEscapeContent } from "@/modes/escape/logic";
import type { PublicGame } from "../game/types";
import { CheckCard } from "../game/CheckCard";

const TIME_LIMIT = 20 * 60;
const ZONE_POS: Record<string, [number, number]> = {
  "top-left": [18, 20], "top-center": [50, 18], "top-right": [82, 20],
  "middle-left": [16, 50], center: [50, 52], "middle-right": [84, 50],
  "bottom-left": [20, 80], "bottom-center": [50, 82], "bottom-right": [80, 80],
};

export function EscapeRoomGame({ game }: { game: PublicGame<PublicEscapeContent> }) {
  const spec = game.spec!, c = spec.content;
  const [phase, setPhase] = useState<"briefing" | "play" | "done">("briefing");
  const [roomIdx, setRoomIdx] = useState(0);
  const [open, setOpen] = useState<string | null>(null);
  const [solved, setSolved] = useState<Record<string, string | null>>({}); // checkId -> clue
  const [hintsUsed, setHintsUsed] = useState(0);
  const [guide, setGuide] = useState(false);
  const [left, setLeft] = useState(TIME_LIMIT);

  useEffect(() => {
    if (phase !== "play") return;
    const t = setInterval(() => setLeft((s) => Math.max(0, s - 1)), 1000);
    return () => clearInterval(t);
  }, [phase]);

  const room = c.rooms[roomIdx];
  const locks = room.hotspots.filter((h) => h.lock_check_id);
  const roomOpen = locks.every((h) => h.lock_check_id in solved);
  const hotspot = room.hotspots.find((h) => h.id === open);
  const check = hotspot?.lock_check_id ? spec.checks.find((k) => k.id === hotspot.lock_check_id) : undefined;
  const mmss = `${Math.floor(left / 60)}:${String(left % 60).padStart(2, "0")}`;

  if (phase === "briefing")
    return (
      <main className="min-h-screen bg-stone-900 px-4 py-12 text-white">
        <div className="mx-auto max-w-2xl space-y-5">
          <p className="text-xs uppercase tracking-[0.2em] text-amber-300">Escape Room · 20 minutes</p>
          <h1 className="text-4xl font-bold">{spec.title}</h1>
          <p className="text-lg text-stone-300">{c.premise}</p>
          <div className="rounded-xl border-l-4 border-amber-400 bg-stone-800 p-4"><p className="text-xs font-semibold uppercase text-amber-300">Briefing</p><p className="mt-1">{spec.briefing}</p></div>
          <button onClick={() => setPhase("play")} className="w-full rounded-xl bg-amber-400 p-4 text-lg font-bold text-stone-900">Start the clock</button>
        </div>
      </main>
    );

  if (phase === "done") {
    const used = TIME_LIMIT - left;
    return (
      <main className="min-h-screen bg-stone-100 px-4 py-12">
        <div className="mx-auto max-w-2xl space-y-5">
          <div className="rounded-2xl bg-teal-700 p-6 text-white">
            <p className="text-sm uppercase tracking-wide opacity-80">You escaped</p>
            <p className="text-3xl font-bold">{spec.outro_win}</p>
            <p className="mt-2">Time: {Math.floor(used / 60)}m {used % 60}s · Hints used: {hintsUsed}</p>
          </div>
          <section className="rounded-2xl bg-white p-6">
            <h2 className="text-lg font-bold">Concepts you used to escape</h2>
            <ul className="mt-3 space-y-3">{c.field_guide.map((f) => <li key={f.concept_id}><p className="font-semibold">{f.title}</p><p className="text-sm text-stone-600">{f.explanation}</p></li>)}</ul>
          </section>
          <a href={`/units/${game.unitId}`} className="block rounded-xl bg-stone-900 p-3 text-center font-semibold text-white">Back to the Arcade</a>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-stone-900 text-white">
      <header className="flex items-center gap-4 px-4 py-3">
        <div className="flex-1"><p className="text-xs uppercase tracking-wide text-amber-300">Room {roomIdx + 1} of {c.rooms.length}</p><h1 className="font-bold">{room.name}</h1></div>
        <button onClick={() => setGuide(!guide)} className="rounded-lg bg-stone-800 px-3 py-1.5 text-sm">Field Guide</button>
        <p className={`font-mono text-2xl font-bold ${left < 120 ? "text-rose-400" : "text-amber-300"}`}>{left === 0 ? "Time's up" : mmss}</p>
      </header>
      <div className="mx-auto grid max-w-7xl gap-4 p-4 lg:grid-cols-[2fr_1fr]">
        <div>
          <div className="relative overflow-hidden rounded-2xl">
            {game.assets[`scene:${room.id}`] ? <img src={game.assets[`scene:${room.id}`]} alt={room.name} className="w-full" /> : <div className="aspect-video bg-stone-700" />}
            {room.hotspots.map((h) => {
              const [x, y] = ZONE_POS[h.zone] ?? [50, 50];
              const done = !!h.lock_check_id && h.lock_check_id in solved;
              return (
                <button key={h.id} onClick={() => setOpen(h.id)} style={{ left: `${x}%`, top: `${y}%` }}
                  className={`absolute -translate-x-1/2 -translate-y-1/2 rounded-full px-3 py-1.5 text-sm font-semibold shadow-lg ring-2 ${open === h.id ? "ring-white" : "ring-transparent"} ${done ? "bg-teal-600" : h.lock_check_id ? "bg-rose-700" : "bg-amber-400 text-stone-900"}`}>
                  {done ? "🔓" : h.lock_check_id ? "🔒" : "🔍"} {h.label}
                </button>
              );
            })}
          </div>
          <p className="mt-3 text-sm text-stone-300">{room.description}</p>
          <p className="mt-1 text-sm text-stone-400">{locks.filter((h) => h.lock_check_id in solved).length}/{locks.length} locks open</p>
        </div>
        <aside className="space-y-3 text-stone-900">
          {guide && <div className="space-y-2 rounded-xl bg-white p-4">{c.field_guide.map((f) => <div key={f.concept_id}><p className="font-semibold">{f.title}</p><p className="text-sm text-stone-600">{f.explanation}</p></div>)}</div>}
          {hotspot ? (
            <div className="space-y-3 rounded-xl bg-[#fbf7ec] p-4">
              <p className="text-lg font-bold">{hotspot.label}</p>
              <p className="text-sm">{hotspot.description}</p>
              {check && <CheckCard key={check.id} gameId={game.id} check={check} onHint={() => setHintsUsed((n) => n + 1)}
                onSolved={(id, clue) => setSolved((s) => ({ ...s, [id]: clue ?? null }))} />}
            </div>
          ) : <p className="rounded-xl bg-stone-800 p-4 text-sm text-stone-300">Click objects in the room to examine them. 🔍 objects hold clues, 🔒 objects are locks.</p>}
          {Object.values(solved).some(Boolean) && (
            <div className="rounded-xl bg-amber-100 p-4 text-sm"><p className="font-semibold">Clues found</p>{Object.values(solved).filter(Boolean).map((cl, i) => <p key={i} className="mt-1">🔓 {cl}</p>)}</div>
          )}
          {roomOpen && (
            <button onClick={() => { setOpen(null); if (roomIdx + 1 < c.rooms.length) setRoomIdx(roomIdx + 1); else setPhase("done"); }}
              className="w-full rounded-xl bg-teal-600 p-4 text-lg font-bold text-white">{roomIdx + 1 < c.rooms.length ? "The door is open → next room" : "Escape!"}</button>
          )}
        </aside>
      </div>
    </main>
  );
}
