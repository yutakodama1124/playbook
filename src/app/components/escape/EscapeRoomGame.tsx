"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import type { PublicEscapeContent } from "@/modes/escape/logic";
import type { PublicGame } from "../game/types";
import { Hud, Stamp, useFloatingPoints } from "../game/Juice";
import { LockModal } from "./LockModal";
import { BookIcon, DoorIcon, LockIcon, NotePopup, ShardIcon, Sheet } from "./parts";
import { Scene, type Spot, type SpotState } from "./Scene";
import { Briefing, Debrief } from "./Screens";
import { fmtClock, lockWorth, streakBonus } from "./scoring";

const TIME_LIMIT = 20 * 60;

type Hotspot = PublicEscapeContent["rooms"][number]["hotspots"][number];

export function EscapeRoomGame({ game }: { game: PublicGame<PublicEscapeContent> }) {
  const spec = game.spec!, c = spec.content;
  const [phase, setPhase] = useState<"briefing" | "play" | "done">("briefing");
  const [elapsed, setElapsed] = useState(0);
  const [timeUpSeen, setTimeUpSeen] = useState(false);
  const [roomIdx, setRoomIdx] = useState(0);
  const [openId, setOpenId] = useState<string | null>(null);
  const [reading, setReading] = useState<{ kicker: string; title: string; text: string } | null>(null);
  const [guide, setGuide] = useState(false);
  const [solved, setSolved] = useState<Record<string, string | null>>({}); // checkId -> fragment
  const [lockHints, setLockHints] = useState<Record<string, number>>({});
  const [seen, setSeen] = useState<Record<string, true>>({});
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  const [stamp, setStamp] = useState(0); // >0 shows "UNLOCKED"; bumps to remount
  const [escaped, setEscaped] = useState(false);
  const [flying, setFlying] = useState<{ slot: number; key: number } | null>(null);
  const { show: showPoints, node: pointsNode } = useFloatingPoints();

  // Elapsed keeps counting after the limit so the debrief can show real time.
  useEffect(() => {
    if (phase !== "play" || escaped) return;
    const t = setInterval(() => setElapsed((s) => s + 1), 1000);
    return () => clearInterval(t);
  }, [phase, escaped]);
  const left = Math.max(0, TIME_LIMIT - elapsed);

  const room = c.rooms[roomIdx];
  const allHotspots = c.rooms.flatMap((r) => r.hotspots);
  const locks = room.hotspots.filter((h) => h.lock_check_id);
  // Meta-puzzle: the exit lock stays sealed until every other lock in the game is open.
  const feeders = allHotspots.filter((h) => h.lock_check_id && !h.is_exit);
  const exitReady = feeders.every((h) => h.lock_check_id in solved);
  const roomOpen = locks.every((h) => h.lock_check_id in solved);
  const totalLocks = allHotspots.filter((h) => h.lock_check_id).length;
  const openedTotal = allHotspots.filter((h) => h.lock_check_id && h.lock_check_id in solved).length;
  const hintsUsed = Object.values(lockHints).reduce((a, b) => a + b, 0);
  const fragments = feeders.map((h) => (h.lock_check_id in solved ? solved[h.lock_check_id] ?? "Lock opened." : null));

  const stateOf = (h: Hotspot): SpotState =>
    !h.lock_check_id ? (seen[h.id] ? "clue-seen" : "clue")
    : h.lock_check_id in solved ? "open"
    : h.is_exit ? (exitReady ? "ready" : "sealed") : "locked";
  const spots: Spot[] = room.hotspots.map((h) => ({ id: h.id, label: h.label, zone: h.zone, state: stateOf(h) }));

  function pick(id: string) {
    const h = room.hotspots.find((x) => x.id === id);
    if (!h) return;
    const st = stateOf(h);
    if (st === "clue" || st === "clue-seen") { setSeen((s) => ({ ...s, [h.id]: true })); setReading({ kicker: "You look closer", title: h.label, text: h.description }); return; }
    if (st === "open") { setReading({ kicker: "Unlocked", title: h.label, text: h.is_exit ? "The way out is open." : solved[h.lock_check_id] ?? "This lock is open." }); return; }
    if (st === "sealed") {
      const have = fragments.filter(Boolean).length;
      setReading({ kicker: "Sealed", title: h.label, text: `${h.description}\n\nThis lock won't even light up yet. Open every other lock to collect all ${feeders.length} fragments first. You have ${have}.` });
      return;
    }
    setOpenId(h.id);
  }

  const openHotspot = room.hotspots.find((h) => h.id === openId);
  const openCheck = openHotspot ? spec.checks.find((k) => k.id === openHotspot.lock_check_id) : undefined;

  function solve(h: Hotspot, reveal: string | null) {
    const hints = lockHints[h.lock_check_id] ?? 0;
    const next = streak + 1;
    const pts = lockWorth(hints, h.is_exit) + streakBonus(next);
    setScore((s) => s + pts);
    setStreak(next);
    setBestStreak((b) => Math.max(b, next));
    setSolved((s) => ({ ...s, [h.lock_check_id]: reveal }));
    setOpenId(null);
    showPoints(pts);
    if (h.is_exit) { setEscaped(true); return; }
    setStamp((n) => n + 1);
    const slot = feeders.findIndex((f) => f.id === h.id);
    if (slot >= 0) setFlying((f) => ({ slot, key: (f?.key ?? 0) + 1 }));
  }

  const clearStamp = useCallback(() => setStamp(0), []);
  const finish = useCallback(() => setPhase("done"), []);

  function reset() {
    setPhase("briefing"); setElapsed(0); setTimeUpSeen(false); setRoomIdx(0); setOpenId(null); setReading(null); setGuide(false);
    setSolved({}); setLockHints({}); setSeen({}); setScore(0); setStreak(0); setBestStreak(0); setStamp(0); setEscaped(false); setFlying(null);
  }

  if (phase === "briefing")
    return <Briefing title={spec.title} hook={spec.hook} premise={c.premise} briefing={spec.briefing} bg={game.assets[`scene:${c.rooms[0].id}`]}
      rooms={c.rooms.length} locks={totalLocks} minutes={TIME_LIMIT / 60} onStart={() => setPhase("play")} />;

  if (phase === "done")
    return <Debrief outro={spec.outro_win} elapsed={elapsed} limit={TIME_LIMIT} score={score} hints={hintsUsed} locks={openedTotal} bestStreak={bestStreak}
      concepts={c.field_guide} unitHref={`/units/${game.unitId}`} onReplay={reset} />;

  const notes = allHotspots.filter((h) => !h.lock_check_id && seen[h.id]).map((h) => ({ title: h.label, text: h.description }));
  const hasNext = roomIdx + 1 < c.rooms.length;

  return (
    <div className="fixed inset-0 flex flex-col bg-zinc-950 text-white">
      {/* HUD */}
      <header className="z-20 flex h-14 shrink-0 items-center gap-2.5 sm:gap-4 border-b border-white/10 bg-black/80 px-3 backdrop-blur sm:px-4">
        <Link href={`/units/${game.unitId}`} aria-label="Leave the game" className="hidden text-sm font-semibold text-white/60 hover:text-white sm:block">Playbook</Link>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-bold leading-tight sm:text-base">{room.name}</p>
          <p className="truncate text-[11px] font-semibold tabular-nums text-zinc-400">Room {roomIdx + 1}/{c.rooms.length} · {openedTotal}/{totalLocks} locks</p>
        </div>
        <span role="timer" aria-label={`${fmtClock(left)} left`}
          className={`shrink-0 rounded-md px-1.5 py-1 font-mono text-base font-bold tabular-nums sm:text-lg ${left === 0 ? "bg-red-500/20 text-red-300" : left < 120 ? "text-red-400" : "text-white"}`}>
          {fmtClock(left)}
        </span>
        <div className="shrink-0"><Hud score={score} streak={streak} /></div>
        <button onClick={() => setGuide(true)} aria-label="Field guide" className="grid h-10 w-10 shrink-0 place-items-center rounded-lg text-zinc-300 hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white">
          <BookIcon />
        </button>
      </header>

      <Scene key={room.id} roomId={room.id} roomName={room.name} src={game.assets[`scene:${room.id}`]} spots={spots} onPick={pick}
        overlay={
          <>
            {roomIdx > 0 && (
              <button onClick={() => setRoomIdx(roomIdx - 1)} className="absolute left-3 top-3 z-10 h-9 rounded-lg bg-black/70 px-3 text-xs font-semibold text-white/80 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white">
                ← <span className="sm:hidden">Back</span><span className="hidden sm:inline">{c.rooms[roomIdx - 1].name}</span>
              </button>
            )}
            {hasNext && roomOpen && (
              <button onClick={() => setRoomIdx(roomIdx + 1)}
                className="pb-pulse absolute right-3 top-3 z-10 flex h-11 items-center gap-2 rounded-xl bg-amber-300 px-4 text-sm font-black text-zinc-950 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-white">
                <DoorIcon /> Next room
              </button>
            )}
          </>
        } />

      <Inventory fragments={fragments} exitReady={exitReady} landingSlot={flying?.slot ?? null}
        onRead={(i) => setReading({ kicker: `Fragment ${i + 1} of ${feeders.length}`, title: feeders[i].label, text: fragments[i] ?? "" })} />

      {flying && <FlyingShard key={`fly-${flying.key}`} slot={flying.slot} onDone={() => setFlying(null)} />}

      {openHotspot && openCheck && (
        <LockModal key={openCheck.id} gameId={game.id} name={openHotspot.label} flavor={openHotspot.description} check={openCheck} isExit={openHotspot.is_exit}
          worth={lockWorth(lockHints[openCheck.id] ?? 0, openHotspot.is_exit)} hintsUsed={lockHints[openCheck.id] ?? 0}
          notes={notes} fragments={fragments.filter((f): f is string => !!f)}
          onHint={() => setLockHints((m) => ({ ...m, [openCheck.id]: Math.min(3, (m[openCheck.id] ?? 0) + 1) }))}
          onWrong={() => setStreak(0)} onSolved={(r) => solve(openHotspot, r)} onClose={() => setOpenId(null)} />
      )}

      {reading && <NotePopup kicker={reading.kicker} title={reading.title} text={reading.text} onClose={() => setReading(null)} />}

      {guide && (
        <Sheet label="Field guide" onClose={() => setGuide(false)} panelClass="border border-white/10 bg-zinc-900 text-zinc-100">
          <div className="px-5 pb-5 pt-4 sm:px-6">
            <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-white/20 sm:hidden" aria-hidden />
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold">Field guide</h2>
              <button onClick={() => setGuide(false)} className="h-9 rounded-lg px-3 text-sm font-semibold text-zinc-300 hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white">Close</button>
            </div>
            <ul className="mt-3 space-y-3">
              {c.field_guide.map((f) => <li key={f.concept_id} className="rounded-xl bg-white/5 px-4 py-3"><p className="font-semibold text-emerald-300">{f.title}</p><p className="mt-1 text-sm leading-relaxed text-zinc-300">{f.explanation}</p></li>)}
            </ul>
          </div>
        </Sheet>
      )}

      {left === 0 && !timeUpSeen && !escaped && (
        <Sheet label="Time's up" onClose={() => setTimeUpSeen(true)} dismissable={false} z="z-40" panelClass="border border-red-400/30 bg-zinc-900 text-white">
          <div className="px-6 pb-6 pt-6 text-center">
            <p className="pb-stamp mx-auto inline-block rounded-lg border-4 border-red-500 px-4 py-1 text-3xl font-black uppercase text-red-500">Time&apos;s up</p>
            <p className="mt-5 text-lg font-semibold leading-snug">{spec.outro_lose}</p>
            <p className="mt-2 text-sm text-zinc-400">You opened {openedTotal} of {totalLocks} locks. You can keep going and finish the room.</p>
            <button onClick={() => setTimeUpSeen(true)} className="mt-6 h-12 w-full rounded-xl bg-white font-bold text-zinc-950 hover:bg-zinc-200 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-white/40">Keep solving</button>
          </div>
        </Sheet>
      )}

      {pointsNode}
      {stamp > 0 && <Stamp key={`stamp-${stamp}`} text="Unlocked" tone="green" onDone={clearStamp} />}
      {escaped && <Stamp text="Escaped" tone="green" onDone={finish} />}
    </div>
  );
}

/** Bottom bar: one slot per fragment. Empty slots show what is still missing. */
function Inventory({ fragments, exitReady, landingSlot, onRead }: { fragments: (string | null)[]; exitReady: boolean; landingSlot: number | null; onRead: (i: number) => void }) {
  const have = fragments.filter(Boolean).length;
  return (
    <footer className="z-20 shrink-0 border-t border-white/10 bg-black/85 pb-[env(safe-area-inset-bottom)] backdrop-blur" aria-label="Inventory">
      <div className="flex items-center gap-3 px-3 pt-2 sm:px-4">
        <p className="text-xs font-bold uppercase tracking-wider text-zinc-400">Fragments <span className="tabular-nums text-white">{have}/{fragments.length}</span></p>
        {exitReady && <p className="pb-pop text-xs font-bold text-amber-300">All found. Find the final lock.</p>}
      </div>
      <ul className="flex gap-2 overflow-x-auto px-3 pb-2.5 pt-2 [scrollbar-width:none] sm:px-4 [&::-webkit-scrollbar]:hidden">
        {fragments.map((f, i) => (
          <li key={i} id={`escape-slot-${i}`} className="shrink-0">
            {f ? (
              <button onClick={() => onRead(i)} aria-label={`Read fragment ${i + 1}`}
                style={{ animationDelay: landingSlot === i ? "650ms" : "0ms" }}
                className="pb-pop flex h-14 w-44 items-center gap-2 rounded-xl border border-amber-300/50 bg-gradient-to-br from-amber-300/25 to-amber-500/5 px-2.5 text-left hover:border-amber-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-300 sm:w-56">
                <ShardIcon className="h-5 w-5 shrink-0 fill-none stroke-amber-300" />
                <span className="line-clamp-2 text-xs leading-snug text-amber-50">{f}</span>
              </button>
            ) : (
              <div className="grid h-14 w-14 place-items-center rounded-xl border border-dashed border-white/20 text-white/25" aria-label={`Fragment ${i + 1}: not found yet`} role="img">
                <LockIcon className="h-4 w-4 fill-none stroke-current" />
              </div>
            )}
          </li>
        ))}
      </ul>
    </footer>
  );
}

/** A glowing shard that flies from the middle of the screen into its inventory slot. */
function FlyingShard({ slot, onDone }: { slot: number; onDone: () => void }) {
  const ref = useRef<HTMLDivElement>(null);
  const done = useRef(onDone);
  useEffect(() => { done.current = onDone; });
  useEffect(() => {
    const el = ref.current, target = document.getElementById(`escape-slot-${slot}`);
    if (!el || !target || window.matchMedia("(prefers-reduced-motion: reduce)").matches) { done.current(); return; }
    target.scrollIntoView({ block: "nearest", inline: "nearest" });
    const r = target.getBoundingClientRect();
    const dx = r.left + 28 - window.innerWidth / 2, dy = r.top + 28 - window.innerHeight / 2;
    const a = el.animate([
      { transform: "translate(-50%,-50%) scale(.4)", opacity: 0 },
      { transform: "translate(-50%,-50%) scale(1.4)", opacity: 1, offset: 0.3 },
      { transform: `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px)) scale(.5)`, opacity: 0.9 },
    ], { duration: 750, easing: "cubic-bezier(.5,0,.3,1)", fill: "forwards" });
    a.onfinish = () => done.current();
    return () => a.cancel();
  }, [slot]);
  return (
    <div ref={ref} className="pointer-events-none fixed left-1/2 top-1/2 z-[45] grid h-14 w-14 place-items-center rounded-2xl border-2 border-amber-300 bg-amber-300/30 text-amber-200 shadow-[0_0_30px_rgba(252,211,77,.7)]" aria-hidden>
      <ShardIcon className="h-7 w-7 fill-none stroke-current" />
    </div>
  );
}
