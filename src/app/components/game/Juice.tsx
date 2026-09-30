"use client";
import { useCallback, useEffect, useState } from "react";

/** Top-of-screen game HUD: hearts, score, streak. Dark by default (sits on game scenes). */
export function Hud({ hearts, maxHearts = 5, score, streak, right }: { hearts?: number; maxHearts?: number; score: number; streak?: number; right?: React.ReactNode }) {
  return (
    <div className="flex items-center gap-5 text-sm font-semibold text-white">
      {hearts !== undefined && (
        <span className="flex gap-0.5" aria-label={`${hearts} of ${maxHearts} lives left`}>
          {Array.from({ length: maxHearts }, (_, i) => (
            <svg key={i} viewBox="0 0 24 24" className={`h-5 w-5 transition-transform ${i < hearts ? "fill-red-500" : "fill-white/15"}`} aria-hidden>
              <path d="M12 21s-7.5-4.6-9.6-9.2C.9 8.4 3 4.5 6.8 4.5c2.1 0 3.6 1.2 4.4 2.4h1.6c.8-1.2 2.3-2.4 4.4-2.4 3.8 0 5.9 3.9 4.4 7.3C19.5 16.4 12 21 12 21z" />
            </svg>
          ))}
        </span>
      )}
      <span className="tabular-nums">{score.toLocaleString()} pts</span>
      {streak !== undefined && streak >= 2 && <span className="pb-pop rounded-md bg-amber-400 px-2 py-0.5 text-xs text-zinc-950">{streak} in a row</span>}
      {right}
    </div>
  );
}

/** Big stamped word for key moments ("OBJECTION!", "CASE CLOSED"). Auto-hides. */
export function Stamp({ text, tone = "red", onDone }: { text: string; tone?: "red" | "green" | "white"; onDone?: () => void }) {
  useEffect(() => { const t = setTimeout(() => onDone?.(), 1300); return () => clearTimeout(t); }, [onDone]);
  const color = tone === "red" ? "border-red-500 text-red-500" : tone === "green" ? "border-emerald-400 text-emerald-400" : "border-white text-white";
  return (
    <div className="pointer-events-none fixed inset-0 z-50 flex items-center justify-center bg-black/30" role="status" aria-live="assertive">
      <p className={`pb-stamp rounded-xl border-[6px] bg-black/70 px-8 py-4 text-5xl font-black uppercase tracking-tight md:text-7xl ${color}`}>{text}</p>
    </div>
  );
}

/** Floating "+100" feedback. Call show(points) and render {node}. */
export function useFloatingPoints() {
  const [items, setItems] = useState<{ id: number; text: string; good: boolean }[]>([]);
  const show = useCallback((points: number) => {
    const id = Date.now() + Math.random();
    setItems((xs) => [...xs, { id, text: points >= 0 ? `+${points}` : `${points}`, good: points >= 0 }]);
    setTimeout(() => setItems((xs) => xs.filter((x) => x.id !== id)), 1000);
  }, []);
  const node = (
    <div className="pointer-events-none fixed left-1/2 top-24 z-40 -translate-x-1/2" aria-hidden>
      {items.map((x) => <p key={x.id} className={`pb-float text-3xl font-black ${x.good ? "text-emerald-400" : "text-red-400"}`}>{x.text}</p>)}
    </div>
  );
  return { show, node };
}

/** Typewriter text for dialogue; click to finish instantly. Render with key={text} so new lines restart. */
export function Typewriter({ text, speed = 18 }: { text: string; speed?: number }) {
  const [n, setN] = useState(0);
  useEffect(() => {
    if (n >= text.length) return;
    const t = setTimeout(() => setN((x) => Math.min(text.length, x + 2)), speed);
    return () => clearTimeout(t);
  }, [n, text, speed]);
  return <span onClick={() => setN(text.length)}>{text.slice(0, n)}</span>;
}
