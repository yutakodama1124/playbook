"use client";
import { useState } from "react";
import type { PublicCheck } from "@/domain/public-spec";

type Result = { correct: boolean; feedback?: string } | null;

export function CheckCard({ gameId, check, onSolved }: { gameId: string; check: PublicCheck; onSolved?: (checkId: string) => void }) {
  const [value, setValue] = useState<unknown>(() => initial(check));
  const [result, setResult] = useState<Result>(null);
  const [hints, setHints] = useState(0);
  const [busy, setBusy] = useState(false);

  async function submit() {
    setBusy(true);
    const res = await fetch(`/api/games/${gameId}/check`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ checkId: check.id, response: value }) });
    const r = (await res.json()) as Result;
    setResult(r); setBusy(false);
    if (r?.correct) onSolved?.(check.id);
  }

  const solved = result?.correct;
  return (
    <div className={`rounded-xl border-2 p-4 ${solved ? "border-teal-600 bg-teal-50" : "border-stone-300 bg-white"}`}>
      <p className="font-medium text-stone-900">{check.prompt}</p>
      <div className="mt-3">{input(check, value, setValue, !!solved)}</div>
      {!solved && (
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <button onClick={submit} disabled={busy} className="rounded-lg bg-stone-900 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">{busy ? "Checking…" : "Check"}</button>
          {hints < 3 && <button onClick={() => setHints(hints + 1)} className="rounded-lg border border-stone-300 px-3 py-2 text-sm">Hint {hints + 1}/3</button>}
        </div>
      )}
      {result && !result.correct && <p className="mt-2 text-sm text-rose-700">Not quite. {result.feedback ?? "Look at the evidence again."}</p>}
      {solved && <p className="mt-2 text-sm font-semibold text-teal-800">Correct.</p>}
      {hints > 0 && !solved && (
        <ol className="mt-3 space-y-1 text-sm text-stone-700">
          {check.hints.slice(0, hints).map((h, i) => <li key={i} className="rounded bg-amber-50 p-2">💡 {h}</li>)}
        </ol>
      )}
    </div>
  );
}

function initial(c: PublicCheck): unknown {
  if (c.kind === "order") return [...(c.items ?? [])];
  if (c.kind === "set") return [];
  if (c.kind === "match") return {};
  return "";
}

function input(c: PublicCheck, value: unknown, set: (v: unknown) => void, locked: boolean) {
  switch (c.kind) {
    case "number":
      return <input type="number" disabled={locked} value={String(value)} onChange={(e) => set(e.target.value)} className="w-40 rounded-lg border p-2" />;
    case "choice":
      return <div className="grid gap-2">{c.options!.map((o) => (
        <button key={o} disabled={locked} onClick={() => set(o)} className={`rounded-lg border p-2 text-left text-sm ${value === o ? "border-stone-900 bg-stone-100" : "border-stone-300"}`}>{o}</button>))}</div>;
    case "set": {
      const v = value as string[];
      return <div className="grid gap-2">{c.options!.map((o) => (
        <label key={o} className="flex items-center gap-2 text-sm"><input type="checkbox" disabled={locked} checked={v.includes(o)} onChange={() => set(v.includes(o) ? v.filter((x) => x !== o) : [...v, o])} />{o}</label>))}</div>;
    }
    case "order": {
      const v = value as string[];
      const move = (i: number, d: number) => { const n = [...v]; [n[i], n[i + d]] = [n[i + d], n[i]]; set(n); };
      return <ol className="grid gap-2">{v.map((o, i) => (
        <li key={o} className="flex items-center gap-2 rounded-lg border border-stone-300 p-2 text-sm">
          <span className="w-5 text-stone-500">{i + 1}.</span><span className="flex-1">{o}</span>
          <button disabled={locked || i === 0} onClick={() => move(i, -1)} aria-label="Move up" className="px-2 disabled:opacity-30">↑</button>
          <button disabled={locked || i === v.length - 1} onClick={() => move(i, 1)} aria-label="Move down" className="px-2 disabled:opacity-30">↓</button>
        </li>))}</ol>;
    }
    case "match": {
      const v = value as Record<string, string>;
      return <div className="grid gap-2">{c.left!.map((l) => (
        <label key={l} className="flex items-center gap-2 text-sm"><span className="flex-1">{l}</span>
          <select disabled={locked} value={v[l] ?? ""} onChange={(e) => set({ ...v, [l]: e.target.value })} className="rounded border p-1">
            <option value="">—</option>{c.right!.map((r) => <option key={r}>{r}</option>)}
          </select></label>))}</div>;
    }
  }
}
