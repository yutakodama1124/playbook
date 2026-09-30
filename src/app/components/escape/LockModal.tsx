"use client";
import { useEffect, useEffectEvent, useRef, useState } from "react";
import type { PublicCheck } from "@/domain/public-spec";
import { deviceId } from "../device";
import { LockIcon, Sheet } from "./parts";
import { HINT_COST } from "./scoring";

type Note = { title: string; text: string };

export function LockModal({ gameId, name, flavor, check, isExit, worth, hintsUsed, notes, fragments, onHint, onWrong, onSolved, onClose }: {
  gameId: string; name: string; flavor: string; check: PublicCheck; isExit: boolean; worth: number; hintsUsed: number;
  notes: Note[]; fragments: string[];
  onHint: () => void; onWrong: () => void; onSolved: (reveal: string | null) => void; onClose: () => void;
}) {
  const [value, setValue] = useState<unknown>(() => initial(check));
  const [msg, setMsg] = useState<{ tone: "wrong" | "error"; text: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const shakeRef = useRef<HTMLDivElement>(null);

  function shake() {
    const el = shakeRef.current;
    if (!el) return;
    el.classList.remove("pb-shake");
    void el.offsetWidth; // restart the animation
    el.classList.add("pb-shake");
  }

  async function submit() {
    if (busy || !ready(check, value)) return;
    setBusy(true);
    setMsg(null);
    try {
      const res = await fetch(`/api/games/${gameId}/check`, { method: "POST", headers: { "content-type": "application/json", "x-device-id": deviceId() }, body: JSON.stringify({ checkId: check.id, response: value }) });
      const r = (await res.json().catch(() => null)) as { correct?: boolean; feedback?: string; reveal?: string | null; error?: string } | null;
      if (!res.ok || !r || typeof r.correct !== "boolean") { setMsg({ tone: "error", text: r?.error ?? "Couldn't check that. Try again." }); return; }
      if (r.correct) { onSolved(r.reveal ?? null); return; }
      setMsg({ tone: "wrong", text: r.feedback ?? "Check your clues and try again." });
      shake();
      onWrong();
    } catch {
      setMsg({ tone: "error", text: "Couldn't reach the server. Try again." });
    } finally {
      setBusy(false);
    }
  }

  const canSubmit = ready(check, value) && !busy;
  return (
    <Sheet label={name} onClose={onClose} panelClass="border border-white/10 bg-zinc-900 text-zinc-100">
      <div ref={shakeRef} className="px-5 pb-5 pt-4 sm:px-6">
        <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-white/20 sm:hidden" aria-hidden />
        <div className="flex items-start gap-3">
          <span className={`grid h-11 w-11 shrink-0 place-items-center rounded-full border-2 ${isExit ? "border-amber-300 text-amber-300" : "border-sky-300 text-sky-300"}`}><LockIcon /></span>
          <div className="min-w-0 flex-1">
            <h2 className="text-lg font-bold leading-tight">{name}</h2>
            <p className="mt-0.5 text-sm tabular-nums text-zinc-400">Worth <span className="font-semibold text-emerald-300">{worth} pts</span>{hintsUsed === 0 && " (no-hint bonus)"}</p>
          </div>
          <button onClick={onClose} aria-label="Close" className="-mr-1 grid h-10 w-10 place-items-center rounded-full text-zinc-400 hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white">
            <svg viewBox="0 0 24 24" className="h-5 w-5 fill-none stroke-current" strokeWidth={2} strokeLinecap="round" aria-hidden><path d="M6 6l12 12M18 6 6 18" /></svg>
          </button>
        </div>

        {flavor && <p className="mt-4 rounded-lg border border-white/10 bg-black/40 px-3 py-2 font-mono text-[13px] leading-relaxed text-emerald-200/90">{flavor}</p>}
        <p className="mt-4 text-[17px] font-medium leading-snug text-white">{check.prompt}</p>

        {isExit && fragments.length > 0 && (
          <ul className="mt-4 space-y-1.5" aria-label="Your fragments">
            {fragments.map((f, i) => <li key={i} className="rounded-lg border border-amber-300/30 bg-amber-300/10 px-3 py-2 text-sm text-amber-100"><span className="font-semibold text-amber-300">Fragment {i + 1}.</span> {f}</li>)}
          </ul>
        )}

        <div className="mt-5">
          <LockInput check={check} value={value} set={(v) => { setValue(v); setMsg(null); }} update={(fn) => { setValue((v: unknown) => fn(String(v))); setMsg(null); }} onEnter={submit} />
        </div>

        <div aria-live="polite">
          {msg && (
            <p className={`pb-rise mt-4 rounded-lg px-3 py-2.5 text-sm leading-snug ${msg.tone === "wrong" ? "border border-red-400/40 bg-red-500/15 text-red-100" : "bg-white/5 text-zinc-300"}`}>
              {msg.tone === "wrong" && <span className="font-bold text-red-300">Still locked. </span>}{msg.text}
            </p>
          )}
        </div>

        <button onClick={submit} disabled={!canSubmit}
          className="mt-5 h-14 w-full rounded-xl bg-emerald-400 text-lg font-bold text-zinc-950 transition active:scale-[.98] hover:bg-emerald-300 disabled:cursor-not-allowed disabled:bg-white/10 disabled:text-zinc-500 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-emerald-400/40">
          {busy ? "Trying…" : "Try to unlock"}
        </button>

        {/* Hints: three steps, each one lowers what this lock is worth. */}
        <div className="mt-5 border-t border-white/10 pt-4">
          {hintsUsed > 0 && (
            <ol className="mb-3 space-y-2">
              {check.hints.slice(0, hintsUsed).map((h, i) => <li key={i} className="pb-rise text-sm leading-snug text-zinc-300"><span className="font-semibold text-sky-300">Hint {i + 1}.</span> {h}</li>)}
            </ol>
          )}
          <div className="flex flex-wrap items-center justify-between gap-2">
            {hintsUsed < Math.min(3, check.hints.length)
              ? <button onClick={onHint} className="h-10 rounded-lg border border-sky-300/40 px-3 text-sm font-semibold text-sky-200 hover:bg-sky-300/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-300">
                  {hintsUsed === 0 ? "Get a hint" : "Another hint"} <span className="font-normal text-sky-300/70">(-{HINT_COST} pts)</span>
                </button>
              : <span className="text-sm text-zinc-500">No hints left</span>}
            {notes.length > 0 && <NotesToggle notes={notes} />}
          </div>
        </div>
      </div>
    </Sheet>
  );
}

function NotesToggle({ notes }: { notes: Note[] }) {
  return (
    <details className="group w-full sm:w-auto sm:flex-none">
      <summary className="cursor-pointer list-none rounded-lg px-2 py-2 text-sm font-semibold text-zinc-300 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white sm:text-right">
        Your notes ({notes.length}) <span className="inline-block transition-transform group-open:rotate-180">▾</span>
      </summary>
      <ul className="mt-2 space-y-2 text-left">
        {notes.map((n, i) => <li key={i} className="rounded-lg bg-[#efe6cf] px-3 py-2 text-sm text-zinc-900"><p className="font-semibold">{n.title}</p><p className="mt-0.5 font-mono text-[13px] leading-relaxed">{n.text}</p></li>)}
      </ul>
    </details>
  );
}

function initial(c: PublicCheck): unknown {
  if (c.kind === "order") return [...(c.items ?? [])];
  if (c.kind === "set") return [];
  if (c.kind === "match") return {};
  return "";
}

function ready(c: PublicCheck, v: unknown): boolean {
  switch (c.kind) {
    case "number": return /\d/.test(String(v)) && Number.isFinite(Number(v));
    case "choice": return typeof v === "string" && v !== "";
    case "set": return (v as string[]).length > 0;
    case "match": return (c.left ?? []).every((l) => !!(v as Record<string, string>)[l]);
    case "order": return true;
  }
}

const tile = (on: boolean) =>
  `relative w-full rounded-xl border-2 px-4 py-3.5 text-left text-[15px] leading-snug transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-white/30 ${on ? "border-emerald-300 bg-emerald-300/15 text-white" : "border-white/10 bg-white/5 text-zinc-200 hover:border-white/30 hover:bg-white/10"}`;

function LockInput({ check, value, set, update, onEnter }: { check: PublicCheck; value: unknown; set: (v: unknown) => void; update: (fn: (v: string) => string) => void; onEnter: () => void }) {
  switch (check.kind) {
    case "number": return <Keypad value={String(value)} update={update} onEnter={onEnter} />;
    case "choice":
      return (
        <div role="radiogroup" aria-label="Choose one" className="grid gap-2.5">
          {check.options!.map((o, i) => (
            <button key={o} role="radio" aria-checked={value === o} onClick={() => set(o)} className={tile(value === o)}>
              <span className="flex items-start gap-3">
                <span className={`grid h-7 w-7 shrink-0 place-items-center rounded-md text-sm font-bold ${value === o ? "bg-emerald-300 text-zinc-950" : "bg-white/10 text-zinc-300"}`}>{String.fromCharCode(65 + i)}</span>
                <span className="pt-0.5">{o}</span>
              </span>
            </button>
          ))}
        </div>
      );
    case "set": {
      const v = value as string[];
      return (
        <div className="grid gap-2.5">
          <p className="text-sm text-zinc-400">Pick every one that fits.</p>
          {check.options!.map((o) => {
            const on = v.includes(o);
            return (
              <button key={o} aria-pressed={on} onClick={() => set(on ? v.filter((x) => x !== o) : [...v, o])} className={tile(on)}>
                <span className="flex items-start gap-3">
                  <span className={`grid h-6 w-6 shrink-0 place-items-center rounded-md border-2 ${on ? "border-emerald-300 bg-emerald-300 text-zinc-950" : "border-white/30"}`}>
                    {on && <svg viewBox="0 0 24 24" className="h-4 w-4 fill-none stroke-current" strokeWidth={3} aria-hidden><path d="m5 12 5 5 9-10" /></svg>}
                  </span>
                  <span>{o}</span>
                </span>
              </button>
            );
          })}
        </div>
      );
    }
    case "order": {
      const v = value as string[];
      const move = (i: number, d: number) => { const n = [...v]; [n[i], n[i + d]] = [n[i + d], n[i]]; set(n); };
      return (
        <div>
          <p className="mb-2.5 text-sm text-zinc-400">Put them in order, first at the top.</p>
          <ol className="grid gap-2">
            {v.map((o, i) => (
              <li key={o} className="flex items-center gap-2 rounded-xl border-2 border-white/10 bg-white/5 py-1.5 pl-3 pr-1.5">
                <span className="grid h-7 w-7 shrink-0 place-items-center rounded-md bg-sky-300/15 text-sm font-bold tabular-nums text-sky-200">{i + 1}</span>
                <span className="flex-1 text-[15px] leading-snug text-zinc-100">{o}</span>
                <span className="flex shrink-0 flex-col gap-1 sm:flex-row">
                  <button disabled={i === 0} onClick={() => move(i, -1)} aria-label={`Move "${o}" up`} className="grid h-9 w-9 place-items-center rounded-lg bg-white/10 text-zinc-200 hover:bg-white/20 disabled:opacity-25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white">↑</button>
                  <button disabled={i === v.length - 1} onClick={() => move(i, 1)} aria-label={`Move "${o}" down`} className="grid h-9 w-9 place-items-center rounded-lg bg-white/10 text-zinc-200 hover:bg-white/20 disabled:opacity-25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white">↓</button>
                </span>
              </li>
            ))}
          </ol>
        </div>
      );
    }
    case "match": {
      const v = value as Record<string, string>;
      return (
        <div className="grid gap-2.5">
          <p className="text-sm text-zinc-400">Connect each one to its partner.</p>
          {check.left!.map((l) => (
            <label key={l} className={`grid gap-2 rounded-xl border-2 px-3 py-2.5 sm:grid-cols-[1fr_1fr] sm:items-center ${v[l] ? "border-emerald-300/50 bg-emerald-300/5" : "border-white/10 bg-white/5"}`}>
              <span className="text-[15px] font-medium leading-snug text-zinc-100">{l}</span>
              <select value={v[l] ?? ""} onChange={(e) => set({ ...v, [l]: e.target.value })}
                className="h-11 w-full rounded-lg border border-white/15 bg-zinc-950 px-3 text-sm text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300">
                <option value="">Choose…</option>
                {check.right!.map((r) => <option key={r} value={r}>{r}</option>)}
              </select>
            </label>
          ))}
        </div>
      );
    }
  }
}

/** Physical-style keypad with an LED display. Also listens for the real keyboard. */
function Keypad({ value, update, onEnter }: { value: string; update: (fn: (v: string) => string) => void; onEnter: () => void }) {
  const press = (k: string) => update((v) => {
    if (k === "back") return v.slice(0, -1);
    if (k === "clear") return "";
    if (k === "neg") return v.startsWith("-") ? v.slice(1) : `-${v}`;
    if (k === "." && v.includes(".")) return v;
    if (v.replace("-", "").length >= 10) return v;
    return v + k;
  });
  const onKey = useEffectEvent((e: KeyboardEvent) => {
    const t = e.target as HTMLElement | null;
    if (t && (t.tagName === "INPUT" || t.tagName === "SELECT" || t.tagName === "TEXTAREA")) return;
    if (e.metaKey || e.ctrlKey || e.altKey) return;
    if (/^[0-9]$/.test(e.key) || e.key === ".") { e.preventDefault(); press(e.key); }
    else if (e.key === "-") { e.preventDefault(); press("neg"); }
    else if (e.key === "Backspace") { e.preventDefault(); press("back"); }
    else if (e.key === "Enter" && t?.tagName !== "BUTTON") { e.preventDefault(); onEnter(); }
  });
  useEffect(() => {
    const h = (e: KeyboardEvent) => onKey(e);
    document.addEventListener("keydown", h);
    return () => document.removeEventListener("keydown", h);
  }, []);

  const keys = ["7", "8", "9", "4", "5", "6", "1", "2", "3", ".", "0", "back"];
  return (
    <div className="mx-auto max-w-xs">
      <div className="flex items-center gap-2 rounded-xl border-2 border-black bg-black px-4 py-3 shadow-[inset_0_2px_12px_rgba(0,0,0,.8)]">
        <output aria-live="polite" aria-label="Code entered" className="flex-1 truncate text-right font-mono text-3xl font-bold tabular-nums tracking-widest text-emerald-300 [text-shadow:0_0_12px_rgba(110,231,183,.6)]">
          {value || <span className="text-emerald-300/25">----</span>}
        </output>
      </div>
      <div className="mt-3 grid grid-cols-3 gap-2">
        {keys.map((k) => (
          <button key={k} onClick={() => press(k)} aria-label={k === "back" ? "Delete last digit" : k === "." ? "Decimal point" : k}
            className="h-14 rounded-xl border-b-4 border-zinc-950 bg-zinc-700 font-mono text-2xl font-bold text-white transition active:translate-y-0.5 active:border-b-2 hover:bg-zinc-600 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-white/40">
            {k === "back" ? "⌫" : k}
          </button>
        ))}
      </div>
      <div className="mt-2 grid grid-cols-2 gap-2">
        <button onClick={() => press("neg")} className="h-10 rounded-lg bg-white/5 text-sm font-semibold text-zinc-300 hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white">+/-</button>
        <button onClick={() => press("clear")} className="h-10 rounded-lg bg-white/5 text-sm font-semibold text-zinc-300 hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white">Clear</button>
      </div>
    </div>
  );
}
