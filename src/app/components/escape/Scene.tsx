"use client";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { CheckIcon, LockIcon, SearchIcon } from "./parts";

export type SpotState = "clue" | "clue-seen" | "locked" | "open" | "sealed" | "ready";
export type Spot = { id: string; label: string; zone: string; state: SpotState };

// Zone -> position inside the scene (percent). Kept a little in from the edges so rings and labels never clip.
const ZONE_POS: Record<string, [number, number]> = {
  "top-left": [18, 24], "top-center": [50, 22], "top-right": [82, 24],
  "middle-left": [16, 50], center: [50, 52], "middle-right": [84, 50],
  "bottom-left": [20, 76], "bottom-center": [50, 78], "bottom-right": [80, 76],
};

const STATE_WORD: Record<SpotState, string> = {
  clue: "clue, not looked at yet", "clue-seen": "clue, already read", locked: "locked", open: "unlocked", sealed: "sealed", ready: "final lock, ready",
};

/**
 * The room: art fills the area. On narrow screens the scene keeps its shape and pans sideways
 * (swipe to look around), so hotspots stay on the objects they belong to.
 */
export function Scene({ roomId, roomName, src, spots, onPick, overlay }: {
  roomId: string; roomName: string; src?: string; spots: Spot[]; onPick: (id: string) => void; overlay?: ReactNode;
}) {
  const scroller = useRef<HTMLDivElement>(null);
  const center = useRef(0);
  const [ratio, setRatio] = useState(16 / 9);
  const [pannable, setPannable] = useState(false);
  const [panned, setPanned] = useState(false);

  // Start each room centered; note whether the scene is wider than the screen.
  useEffect(() => {
    const el = scroller.current;
    if (!el) return;
    const sync = () => { center.current = (el.scrollWidth - el.clientWidth) / 2; el.scrollLeft = center.current; setPannable(el.scrollWidth - el.clientWidth > 24); };
    sync();
    const ro = new ResizeObserver(sync);
    ro.observe(el);
    return () => ro.disconnect();
  }, [roomId, ratio]);

  return (
    <div className="relative min-h-0 flex-1 overflow-hidden bg-zinc-950">
      <div ref={scroller} onScroll={(e) => { if (!panned && Math.abs(e.currentTarget.scrollLeft - center.current) > 24) setPanned(true); }} className="absolute inset-0 overflow-x-auto overflow-y-hidden [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <div className="relative h-full min-w-full" style={{ aspectRatio: String(ratio), width: "auto" }}>
          {src
            ? // eslint-disable-next-line @next/next/no-img-element -- remote generated art, sized by CSS
              <img key={src} src={src} alt={roomName} onLoad={(e) => { const i = e.currentTarget; if (i.naturalWidth && i.naturalHeight) setRatio(i.naturalWidth / i.naturalHeight); }}
                className="pb-rise absolute inset-0 h-full w-full select-none object-cover" draggable={false} />
            : <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,#27272a_0%,#09090b_75%)]" aria-hidden />}
          {/* Vignette so rings and labels read on any art. */}
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_45%,rgba(0,0,0,.55)_100%)]" aria-hidden />
          {spots.map((s) => <Hotspot key={s.id} spot={s} onPick={() => onPick(s.id)} />)}
        </div>
      </div>
      {pannable && !panned && (
        <p className="pb-rise pointer-events-none absolute inset-x-0 bottom-3 mx-auto w-fit rounded-full bg-black/70 px-3 py-1.5 text-xs font-semibold text-white">Swipe to look around</p>
      )}
      {overlay}
    </div>
  );
}

function Hotspot({ spot, onPick }: { spot: Spot; onPick: () => void }) {
  const [x, y] = ZONE_POS[spot.zone] ?? [50, 50];
  const s = spot.state;
  const ring =
    s === "open" ? "border-emerald-400 bg-emerald-950/75 text-emerald-300"
    : s === "sealed" ? "border-zinc-500 bg-zinc-950/80 text-zinc-400"
    : s === "ready" ? "border-amber-300 bg-amber-950/75 text-amber-200 pb-pulse"
    : s === "locked" ? "border-sky-300 bg-sky-950/75 text-sky-200 pb-pulse"
    : s === "clue" ? "border-white bg-black/60 text-white pb-pulse"
    : "border-white/70 bg-black/60 text-white/80";
  const glow = s === "clue" || s === "locked" || s === "ready";
  return (
    <button onClick={onPick} style={{ left: `${x}%`, top: `${y}%` }} aria-label={`${spot.label}, ${STATE_WORD[s]}`}
      className="group absolute z-10 flex -translate-x-1/2 -translate-y-1/2 flex-col items-center gap-1.5 focus:outline-none">
      <span className={`relative grid ${s === "ready" ? "h-16 w-16" : "h-12 w-12"} place-items-center rounded-full border-2 shadow-[0_0_0_3px_rgba(0,0,0,.35),0_0_18px_rgba(0,0,0,.6)] backdrop-blur-[2px] transition-transform duration-150 group-hover:scale-110 group-active:scale-95 group-focus-visible:ring-4 group-focus-visible:ring-white group-focus-visible:ring-offset-2 group-focus-visible:ring-offset-black ${ring}`}>
        {glow && <span className="absolute inset-0 animate-ping rounded-full border-2 border-current opacity-50 [animation-duration:1.8s] motion-reduce:hidden" aria-hidden />}
        {s === "clue" || s === "clue-seen" ? <SearchIcon /> : <LockIcon open={s === "open"} className={s === "ready" ? "h-7 w-7 fill-none stroke-current" : undefined} />}
        {s === "clue-seen" && <span className="absolute -right-1 -top-1 grid h-5 w-5 place-items-center rounded-full bg-white text-zinc-900"><CheckIcon className="h-3 w-3 fill-none stroke-current" /></span>}
      </span>
      <span className={`pointer-events-none max-w-36 truncate rounded-md bg-black/80 px-2 py-0.5 text-xs font-semibold text-white transition-opacity
        opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100 [@media(hover:none)]:opacity-100 ${s === "ready" ? "opacity-100! text-amber-200" : ""}`}>
        {spot.label}
      </span>
    </button>
  );
}
