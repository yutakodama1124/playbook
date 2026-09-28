"use client";
import { useState } from "react";
import type { PublicCheck } from "@/domain/public-spec";
import { deviceId } from "../device";
import { Button, Card, inputClass } from "../ui";

type Result = { correct: boolean; feedback?: string; reveal?: string | null } | null;

export function CheckCard({ gameId, check, onSolved, onHint, onAnswered }: {
  gameId: string; check: PublicCheck; onSolved?: (checkId: string, reveal?: string | null) => void; onHint?: () => void; onAnswered?: (correct: boolean) => void;
}) {
  const [value, setValue] = useState<unknown>(() => initial(check));
  const [result, setResult] = useState<Result>(null);
  const [hints, setHints] = useState(0);
  const [busy, setBusy] = useState(false);

  async function submit() {
    setBusy(true);
    const res = await fetch(`/api/games/${gameId}/check`, { method: "POST", headers: { "content-type": "application/json", "x-device-id": deviceId() }, body: JSON.stringify({ checkId: check.id, response: value }) });
    const r = (await res.json()) as Result;
    setResult(r); setBusy(false);
    if (r) onAnswered?.(r.correct);
    if (r?.correct) onSolved?.(check.id, r.reveal);
  }

  const solved = !!result?.correct;
  return (
    <Card className={`p-5 ${solved ? "border-emerald-600/40" : ""}`}>
      <p className="font-medium leading-snug text-zinc-900">{check.prompt}</p>
      <div className="mt-4">{input(check, value, setValue, solved)}</div>

      {result && !result.correct && <p className="mt-3 text-sm text-red-700">Not quite. {result.feedback ?? "Look at the evidence again."}</p>}
      {solved && <p className="mt-3 text-sm font-medium text-emerald-700">Correct.</p>}
      {solved && result?.reveal && <p className="mt-2 rounded-lg bg-zinc-50 px-3 py-2 text-sm text-zinc-700"><span className="font-medium">Unlocked:</span> {result.reveal}</p>}

      {hints > 0 && !solved && (
        <ol className="mt-4 space-y-2 border-t border-zinc-100 pt-4 text-sm text-zinc-700">
          {check.hints.slice(0, hints).map((h, i) => <li key={i}><span className="font-medium text-zinc-500">Hint {i + 1}.</span> {h}</li>)}
        </ol>
      )}

      {!solved && (
        <div className="mt-4 flex items-center gap-2">
          <Button onClick={submit} disabled={busy}>{busy ? "Checking…" : "Check answer"}</Button>
          {hints < 3 && <Button variant="ghost" onClick={() => { setHints(hints + 1); onHint?.(); }}>{hints === 0 ? "Get a hint" : "Another hint"}</Button>}
        </div>
      )}
    </Card>
  );
}

function initial(c: PublicCheck): unknown {
  if (c.kind === "order") return [...(c.items ?? [])];
  if (c.kind === "set") return [];
  if (c.kind === "match") return {};
  return "";
}

const option = (selected: boolean) =>
  `w-full rounded-lg border px-3 py-2.5 text-left text-sm transition-colors ${selected ? "border-zinc-900 bg-zinc-50 font-medium" : "border-zinc-200 hover:border-zinc-300"}`;

function input(c: PublicCheck, value: unknown, set: (v: unknown) => void, locked: boolean) {
  switch (c.kind) {
    case "number":
      return <input type="number" inputMode="decimal" disabled={locked} value={String(value)} onChange={(e) => set(e.target.value)} placeholder="Your answer" className={`${inputClass} max-w-48`} />;
    case "choice":
      return <div className="space-y-2">{c.options!.map((o) => <button key={o} disabled={locked} onClick={() => set(o)} className={option(value === o)}>{o}</button>)}</div>;
    case "set": {
      const v = value as string[];
      return <div className="space-y-2">{c.options!.map((o) => (
        <label key={o} className={`flex cursor-pointer items-start gap-3 ${option(v.includes(o))}`}>
          <input type="checkbox" className="mt-0.5 accent-zinc-900" disabled={locked} checked={v.includes(o)} onChange={() => set(v.includes(o) ? v.filter((x) => x !== o) : [...v, o])} />{o}
        </label>))}</div>;
    }
    case "order": {
      const v = value as string[];
      const move = (i: number, d: number) => { const n = [...v]; [n[i], n[i + d]] = [n[i + d], n[i]]; set(n); };
      return <ol className="space-y-2">{v.map((o, i) => (
        <li key={o} className="flex items-center gap-3 rounded-lg border border-zinc-200 px-3 py-2 text-sm">
          <span className="w-4 tabular-nums text-zinc-400">{i + 1}</span><span className="flex-1">{o}</span>
          <button disabled={locked || i === 0} onClick={() => move(i, -1)} aria-label={`Move "${o}" up`} className="rounded px-2 py-1 text-zinc-500 hover:bg-zinc-100 disabled:opacity-30">↑</button>
          <button disabled={locked || i === v.length - 1} onClick={() => move(i, 1)} aria-label={`Move "${o}" down`} className="rounded px-2 py-1 text-zinc-500 hover:bg-zinc-100 disabled:opacity-30">↓</button>
        </li>))}</ol>;
    }
    case "match": {
      const v = value as Record<string, string>;
      return <div className="space-y-2">{c.left!.map((l) => (
        <label key={l} className="grid items-center gap-2 text-sm sm:grid-cols-[1fr_1fr]"><span>{l}</span>
          <select disabled={locked} value={v[l] ?? ""} onChange={(e) => set({ ...v, [l]: e.target.value })} className={inputClass}>
            <option value="">Choose…</option>{c.right!.map((r) => <option key={r}>{r}</option>)}
          </select></label>))}</div>;
    }
  }
}
