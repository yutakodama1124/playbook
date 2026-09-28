"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import type { PublicEscapeContent } from "@/modes/escape/logic";
import type { PublicGame } from "../game/types";
import { CheckCard } from "../game/CheckCard";
import { Button, Card, Label, PageHeader, buttonClass } from "../ui";

const TIME_LIMIT = 20 * 60;
const ZONE_POS: Record<string, [number, number]> = {
  "top-left": [18, 22], "top-center": [50, 20], "top-right": [82, 22],
  "middle-left": [16, 50], center: [50, 52], "middle-right": [84, 50],
  "bottom-left": [20, 78], "bottom-center": [50, 80], "bottom-right": [80, 78],
};
const fmt = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;

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
  const opened = locks.filter((h) => h.lock_check_id in solved).length;
  const roomOpen = opened === locks.length;
  const hotspot = room.hotspots.find((h) => h.id === open);
  const check = hotspot?.lock_check_id ? spec.checks.find((k) => k.id === hotspot.lock_check_id) : undefined;
  const status = (h: (typeof room.hotspots)[number]) => (!h.lock_check_id ? "Clue" : h.lock_check_id in solved ? "Open" : "Locked");

  if (phase === "briefing")
    return (
      <>
        <PageHeader />
        <main className="mx-auto max-w-3xl px-4 pb-24 pt-10">
          <p className="text-sm text-zinc-500">Escape room · 2 rooms · 20 minutes</p>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight">{spec.title}</h1>
          <p className="mt-4 text-lg leading-relaxed text-zinc-700">{c.premise}</p>
          <div className="mt-8 border-t border-zinc-200 pt-6"><Label>Briefing</Label><p className="mt-2 leading-relaxed text-zinc-700">{spec.briefing}</p></div>
          <Button size="lg" className="mt-8 w-full" onClick={() => setPhase("play")}>Start the clock</Button>
        </main>
      </>
    );

  if (phase === "done") {
    const used = TIME_LIMIT - left;
    return (
      <>
        <PageHeader />
        <main className="mx-auto max-w-2xl space-y-8 px-4 pb-24 pt-10">
          <div>
            <p className="text-sm font-medium text-emerald-700">Escaped</p>
            <h1 className="mt-1 text-3xl font-semibold tracking-tight">{spec.outro_win}</h1>
            <p className="mt-3 tabular-nums text-zinc-600">{Math.floor(used / 60)}m {used % 60}s · {hintsUsed} hint{hintsUsed === 1 ? "" : "s"} used</p>
          </div>
          <Card className="p-6">
            <h2 className="font-semibold">Concepts you used</h2>
            <ul className="mt-3 divide-y divide-zinc-100">{c.field_guide.map((f) => <li key={f.concept_id} className="py-3"><p className="font-medium">{f.title}</p><p className="mt-0.5 text-sm text-zinc-600">{f.explanation}</p></li>)}</ul>
          </Card>
          <Link href={`/units/${game.unitId}`} className={buttonClass("primary", "lg", "w-full")}>Back to the unit</Link>
        </main>
      </>
    );
  }

  return (
    <>
      <PageHeader>
        <Button variant="ghost" size="sm" onClick={() => setGuide(!guide)} aria-pressed={guide}>Field guide</Button>
        <span className={`text-sm font-medium tabular-nums ${left < 120 ? "text-red-700" : "text-zinc-700"}`}>{left === 0 ? "Time's up" : fmt(left)}</span>
      </PageHeader>
      <main className="mx-auto max-w-7xl px-4 pb-24 pt-6">
        <div className="flex items-baseline justify-between gap-4">
          <div><p className="text-sm text-zinc-500">Room {roomIdx + 1} of {c.rooms.length}</p><h1 className="text-xl font-semibold tracking-tight">{room.name}</h1></div>
          <p className="text-sm tabular-nums text-zinc-500">{opened} of {locks.length} locks open</p>
        </div>

        <div className="mt-4 grid gap-6 lg:grid-cols-[1.8fr_1fr]">
          <div>
            <div className="relative overflow-hidden rounded-xl border border-zinc-200 bg-zinc-900">
              {game.assets[`scene:${room.id}`] ? <img src={game.assets[`scene:${room.id}`]} alt={room.name} className="w-full" /> : <div className="aspect-video" />}
              {room.hotspots.map((h, i) => {
                const [x, y] = ZONE_POS[h.zone] ?? [50, 50];
                const st = status(h);
                return (
                  <button key={h.id} onClick={() => setOpen(h.id)} style={{ left: `${x}%`, top: `${y}%` }} aria-label={`${i + 1}. ${h.label} (${st})`}
                    className={`absolute flex h-8 w-8 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-md text-sm font-semibold shadow-md ring-2 transition-transform hover:scale-110 ${open === h.id ? "ring-white" : "ring-black/10"} ${st === "Open" ? "bg-accent text-white" : "bg-white text-zinc-900"}`}>
                    {i + 1}
                  </button>
                );
              })}
            </div>
            <p className="mt-3 text-sm leading-relaxed text-zinc-600">{room.description}</p>
          </div>

          <aside className="space-y-4">
            <ul className="divide-y divide-zinc-200 rounded-xl border border-zinc-200 bg-white">
              {room.hotspots.map((h, i) => (
                <li key={h.id}>
                  <button onClick={() => setOpen(h.id)} aria-current={open === h.id} className={`flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm ${open === h.id ? "bg-zinc-50" : ""}`}>
                    <span className="w-4 tabular-nums text-zinc-400">{i + 1}</span><span className="flex-1 font-medium">{h.label}</span>
                    <span className={`text-xs ${status(h) === "Open" ? "text-accent" : status(h) === "Locked" ? "text-zinc-900" : "text-zinc-400"}`}>{status(h)}</span>
                  </button>
                </li>
              ))}
            </ul>

            {guide && <Card className="divide-y divide-zinc-100 px-4">{c.field_guide.map((f) => <div key={f.concept_id} className="py-3"><p className="font-medium">{f.title}</p><p className="mt-0.5 text-sm text-zinc-600">{f.explanation}</p></div>)}</Card>}

            {hotspot ? (
              <div className="space-y-3">
                <Card className="p-4"><p className="font-medium">{hotspot.label}</p><p className="mt-1 text-sm leading-relaxed text-zinc-700">{hotspot.description}</p></Card>
                {check && <CheckCard key={check.id} gameId={game.id} check={check} onHint={() => setHintsUsed((n) => n + 1)}
                  onSolved={(id, clue) => setSolved((s) => ({ ...s, [id]: clue ?? null }))} />}
              </div>
            ) : <p className="text-sm text-zinc-500">Select a numbered object to examine it. Clue objects hold information you need for the locks.</p>}

            {Object.values(solved).some(Boolean) && (
              <Card className="p-4"><Label>Unlocked notes</Label><ul className="mt-2 space-y-1.5 text-sm text-zinc-700">{Object.values(solved).filter(Boolean).map((cl, i) => <li key={i}>{cl}</li>)}</ul></Card>
            )}

            {roomOpen && (
              <Button size="lg" className="w-full" onClick={() => { setOpen(null); if (roomIdx + 1 < c.rooms.length) setRoomIdx(roomIdx + 1); else setPhase("done"); }}>
                {roomIdx + 1 < c.rooms.length ? "Go to the next room" : "Escape"}
              </Button>
            )}
          </aside>
        </div>
      </main>
    </>
  );
}
